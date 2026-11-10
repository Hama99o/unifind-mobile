/**
 * authService — Auth0 login orchestration, mirroring the web app.
 *
 * The shared Auth0 client is CONFIDENTIAL (requires the client secret), so the
 * app cannot exchange the code itself — a phone must never hold a secret. So we
 * only obtain the authorization `code` in-app, then hand it to the hosted
 * auth-service broker, which does the secret-backed exchange server-side (same
 * as web). See AUTH_SECURITY.md §2 and the memory `mobile-auth-uses-broker`.
 *
 * Flow:
 *   1. new AuthRequest({ ..., usePKCE: false })   // confidential server exchange
 *   2. request.promptAsync(discovery) — opens the in-app browser (native)
 *      + a Linking deep-link fallback (getAuthCode) to catch the redirect
 *   3. POST { code, redirect_uri } → `${EXPO_PUBLIC_AUTH_URL}/api/google-signin`
 *      → broker returns { access_token, user, user_metadata }
 *   4. Store access token, build user, setSession, merge from Node /userinfo
 *
 * Native redirect: unifind://auth/callback (standalone) / exp://… (Expo Go).
 *
 * Auth0 dashboard must allow (already registered on the confidential client):
 *   Allowed Callback URLs: unifind://auth/callback (+ the exp:// URL in Expo Go)
 *   Allowed Logout URLs:   unifind://auth/callback
 */

import { AuthDeniedError } from "@/auth/authErrors";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";
import { useAuthStore, registerRefreshFn, registerHydrateUserFn } from "@/stores/authStore";
import { nodeApi, registerNodeApiRefreshFn } from "@/api/nodeApi";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";
import type { AuthUser } from "@/stores/authStore";

// Required on iOS/Android — warm up the in-app browser before the first login tap.
// On web, maybeCompleteAuthSession() is called on the /auth/callback page itself.
if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

// ─── Auth0 config ─────────────────────────────────────────────────────────────

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID as string;
const AUTH0_AUDIENCE = process.env.EXPO_PUBLIC_AUTH0_AUDIENCE as string;

/**
 * The hosted auth broker (the same "auth-service" the web app uses, e.g.
 * https://auth-stg.unifind-lb.org). The Auth0 client is CONFIDENTIAL — its
 * token exchange requires the client secret, which a mobile app must never
 * hold. So, exactly like web, we hand the authorization `code` to the broker's
 * `/api/google-signin` endpoint; it performs the code→token exchange
 * server-side (with the secret) and returns the access token to us.
 */
const AUTH_BROKER_URL = (
  process.env.EXPO_PUBLIC_AUTH_URL as string | undefined
)?.replace(/\/+$/, "");

/** Auth0 OpenID Connect discovery document (standard endpoints). */
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  endSessionEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

// Match the web broker's scopes. No offline_access: the confidential-client
// server exchange does not return a refresh token (web runs a 5h session too).
const SCOPES = ["openid", "profile", "email"];

// ─── Redirect URI ─────────────────────────────────────────────────────────────

/**
 * Web:    ${window.location.origin}/auth/callback  (stable popup URL)
 * Native: unifind://auth/callback                  (deep link back into app)
 *
 * Both must be registered in Auth0 "Allowed Callback URLs".
 */
function getRedirectUri(): string {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.location?.origin) {
      return `${window.location.origin}/auth/callback`;
    }
    // SSR / unknown environment fallback
    return "http://localhost:3010/auth/callback";
  }
  // Native — do NOT force scheme:"unifind". A forced custom scheme yields a
  // deep link Expo Go cannot intercept (and that isn't registered in Auth0),
  // producing the "Callback URL mismatch" Auth0 error. Letting makeRedirectUri
  // auto-resolve gives the right URI per runtime:
  //   • Expo Go            → exp://<lan-ip>:<port>/--/auth/callback  (Expo Go catches it)
  //   • dev/standalone app → unifind://auth/callback                (from app.json "scheme")
  // Whichever it returns must be added to Auth0 "Allowed Callback URLs".
  const uri = AuthSession.makeRedirectUri({ path: "auth/callback" });
  if (__DEV__) {
    // One-time visibility so we know the exact value to register in Auth0.
    console.log("[auth] redirect_uri =", uri);
  }
  return uri;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return {};
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isTokenExpired(token: string, bufferSeconds = 60): boolean {
  const payload = decodeJwtPayload(token);
  const exp = typeof payload.exp === "number" ? payload.exp : 0;
  return Date.now() / 1000 >= exp - bufferSeconds;
}

// ─── Build AuthUser from decoded claims ───────────────────────────────────────

function buildUserFromClaims(payload: Record<string, unknown>): AuthUser {
  const sub = (payload.sub as string | undefined) ?? "";
  const userID = sub.includes("|") ? sub.split("|")[1] : sub;
  return {
    sub,
    userID,
    name: payload.name as string | undefined,
    email: payload.email as string | undefined,
    picture: payload.picture as string | undefined,
  };
}

// ─── Fetch /userinfo from Node API ────────────────────────────────────────────

interface NodeUserInfo {
  firstName?: string;
  lastName?: string;
  photo?: string;
  email?: string;
}

export async function fetchNodeUserInfo(): Promise<NodeUserInfo | null> {
  try {
    const res = await nodeApi.get<{ data?: NodeUserInfo; success?: boolean }>(
      "/userinfo"
    );
    return res.data?.data ?? null;
  } catch {
    return null;
  }
}

// ─── Broker token exchange (confidential client, secret stays server-side) ────

interface BrokerTokenResponse {
  access_token: string;
  user?: {
    sub?: string;
    name?: string;
    email?: string;
    picture?: string;
  };
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

/**
 * Exchange the Auth0 authorization `code` for tokens via the hosted broker —
 * the exact server-side, secret-holding exchange the web app relies on.
 * Mirrors web's `POST /api/google-signin { code, redirect_uri }`.
 */
async function exchangeCodeViaBroker(
  code: string,
  redirectUri: string
): Promise<BrokerTokenResponse> {
  if (!AUTH_BROKER_URL) {
    throw new Error(
      "EXPO_PUBLIC_AUTH_URL is not set — cannot reach the auth service"
    );
  }

  const res = await fetch(`${AUTH_BROKER_URL}/api/google-signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirect_uri: redirectUri }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Auth service token exchange failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as BrokerTokenResponse;
  if (!data.access_token) {
    throw new Error("Auth service returned no access token");
  }
  return data;
}

/** Build the AuthUser from the broker response (userinfo + user_metadata). */
function buildUserFromBroker(data: BrokerTokenResponse): AuthUser {
  const sub = data.user?.sub ?? "";
  const userID = sub.includes("|") ? sub.split("|")[1] : sub;
  const meta = data.user_metadata ?? {};
  const fullName =
    meta.first_name || meta.last_name
      ? [meta.first_name, meta.last_name].filter(Boolean).join(" ")
      : data.user?.name;
  return {
    sub,
    userID,
    name: fullName || undefined,
    email: data.user?.email ?? meta.email,
    picture: data.user?.picture,
  };
}

// ─── Merge Node /userinfo into AuthUser ───────────────────────────────────────

async function hydrateUserFromNode(base: AuthUser): Promise<AuthUser> {
  const nodeInfo = await fetchNodeUserInfo();
  if (!nodeInfo) return base;

  const fullName =
    nodeInfo.firstName || nodeInfo.lastName
      ? [nodeInfo.firstName, nodeInfo.lastName].filter(Boolean).join(" ")
      : undefined;

  return {
    ...base,
    name: fullName ?? base.name,
    picture: nodeInfo.photo ?? base.picture,
  };
}

// ─── Token exchange via Node refresh token ────────────────────────────────────

interface RefreshTokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
}

async function exchangeRefreshToken(
  refreshToken: string
): Promise<RefreshTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: AUTH0_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const res = await fetch(`https://${AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<RefreshTokenResponse>;
}

// ─── Authorization-code capture (with deep-link fallback) ─────────────────────

/**
 * After promptAsync reports a dismiss/cancel, wait this long for a redirect
 * deep link to still arrive before concluding the user really aborted. Covers
 * the race where the OS routes the callback to the app slightly *after* the
 * auth-session browser reports itself dismissed.
 */
const DEEP_LINK_GRACE_MS = 1200;

/**
 * Parse an Auth0 callback deep link into its authorization `code`, validating
 * the returned `state` against the request (CSRF protection). Throws on a
 * state mismatch; returns null when no code is present.
 */
function extractCodeFromCallbackUrl(
  url: string,
  request: AuthSession.AuthRequest
): string | null {
  const params = Linking.parse(url).queryParams ?? {};
  const returnedState = params.state;
  if (
    request.state &&
    typeof returnedState === "string" &&
    returnedState !== request.state
  ) {
    throw new Error("Auth0 state mismatch — rejecting callback");
  }
  const code = params.code;
  return typeof code === "string" && code ? code : null;
}

/**
 * Obtain the Auth0 authorization `code` after the user consents.
 *
 * The happy path is `request.promptAsync()` resolving with `type:"success"`.
 * But on native (both Expo Go and standalone builds) the OS sometimes delivers
 * the `unifind://…`/`exp://…` redirect deep link to the *app* instead of to the
 * auth-session browser, so promptAsync resolves with `dismiss` and the code is
 * silently lost — the exact "I authorised and nothing happened" bug.
 *
 * To be robust we register a Linking listener BEFORE opening the browser and
 * (1) race it against promptAsync, then (2) if promptAsync reports a dismiss,
 * still wait a short grace period for a late deep link. Either way we validate
 * `state` against the request to reject any unexpected callback.
 *
 * Returns the code, or `null` when the user genuinely cancelled/dismissed.
 * Throws on an explicit Auth0 error.
 */
async function getAuthCode(
  request: AuthSession.AuthRequest
): Promise<string | null> {
  // ── Deep-link fallback listener (native only) ──
  let linkResolve: ((url: string) => void) | undefined;
  const linkPromise = new Promise<string>((resolve) => {
    linkResolve = resolve;
  });
  const linkSub =
    Platform.OS !== "web"
      ? Linking.addEventListener("url", ({ url }) => {
          if (url && url.includes("code=")) linkResolve?.(url);
        })
      : null;

  const closeBrowser = () => {
    try {
      WebBrowser.dismissAuthSession();
    } catch {
      // no-op
    }
  };

  try {
    const promptPromise = request.promptAsync(discovery);
    // Prevent an unhandled rejection if the deep-link path wins the race and
    // the (now-orphaned) prompt promise later settles/rejects.
    promptPromise.catch(() => undefined);

    const winner = await Promise.race([
      promptPromise.then((result) => ({ kind: "prompt" as const, result })),
      linkPromise.then((url) => ({ kind: "link" as const, url })),
    ]);

    // The deep link beat promptAsync — promptAsync likely never got the code.
    if (winner.kind === "link") {
      if (__DEV__) console.log("[auth] code captured via deep-link fallback");
      closeBrowser(); // promptAsync never resolved — close the browser ourselves.
      return extractCodeFromCallbackUrl(winner.url, request);
    }

    // promptAsync resolved first.
    const result = winner.result;
    if (__DEV__) console.log("[auth] promptAsync.type =", result.type);

    if (result.type === "success") {
      const code = result.params.code;
      if (!code) {
        throw new Error("Authorization code not found in Auth0 callback");
      }
      return code;
    }

    if (__DEV__) {
      console.log(
        "[auth] non-success result →",
        JSON.stringify({
          type: result.type,
          error: (result as { error?: unknown }).error ?? null,
          params: (result as { params?: unknown }).params ?? null,
        })
      );
    }
    if (result.type === "error" && result.error) {
      const errCode =
        (result.error as { code?: string }).code ??
        (result as { params?: Record<string, string> }).params?.error;
      const desc =
        typeof result.error === "object" && result.error !== null
          ? ((result.error as { description?: string }).description ??
            "Unknown Auth0 error")
          : String(result.error);
      // The user tapped Decline on Auth0's consent screen: their choice, not
      // an error. Treat it like closing the browser (measured 2026-11-10).
      if (errCode === "access_denied" && desc === CONSENT_DECLINED) return null;
      if (errCode === "access_denied") {
        forceLoginForm = true;
        throw new AuthDeniedError(desc);
      }
      throw new Error(`Auth0 error: ${desc}`);
    }

    // dismiss / cancel / locked. This is *also* what promptAsync reports when
    // the OS delivered the redirect to the app instead of the browser, so give
    // the deep link a brief grace window before concluding a real cancel.
    if (Platform.OS !== "web") {
      const lateUrl = await Promise.race([
        linkPromise,
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), DEEP_LINK_GRACE_MS)
        ),
      ]);
      if (lateUrl) {
        if (__DEV__) console.log("[auth] code captured after dismiss (grace)");
        return extractCodeFromCallbackUrl(lateUrl, request);
      }
    }

    // User aborted.
    return null;
  } finally {
    linkSub?.remove();
  }
}

// ─── Core login / signup flow ─────────────────────────────────────────────────

/**
 * Runs the Authorization Code flow, then exchanges the code via the hosted
 * broker — mirroring the web app exactly.
 *
 * Because the Auth0 client is CONFIDENTIAL (its token endpoint requires the
 * client secret), the app itself cannot exchange the code — a phone must never
 * hold the secret. So we only obtain the `code` in-app, then hand it to the
 * broker's `/api/google-signin`, which does the secret-backed exchange
 * server-side and returns the access token. usePKCE is therefore OFF (the
 * server-side confidential exchange needs no code_verifier), matching web's
 * google-signin flow.
 *
 * On native: opens an in-app browser (SFSafariViewController / Custom Tabs)
 *            which redirects to unifind://auth/callback; a deep-link fallback
 *            (getAuthCode) captures the code even if promptAsync misses it.
 */
/**
 * Set when Auth0 denied the account (access_denied, e.g. a tenant rule). Its
 * SSO cookie would otherwise auto-submit that same account on every later
 * attempt, so the user never sees the form again and cannot switch account.
 * While set, we add prompt=login; cleared once a login gets through. (Not the
 * default: prompt=login hides Google SSO on Universal Login.)
 */
let forceLoginForm = false;

/** Auth0's error_description when the user declines the consent screen. */
const CONSENT_DECLINED = "User did not authorize the request";

async function performLogin(extraParams?: Record<string, string>): Promise<void> {
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: AUTH0_CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
    usePKCE: false,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      audience: AUTH0_AUDIENCE,
      ...extraParams,
      ...(forceLoginForm ? { prompt: "login" } : {}),
    },
  });

  // Build the authorization URL up front so request.state is populated BEFORE
  // the browser opens. This lets the deep-link fallback below validate state
  // even when promptAsync never resolves with the code.
  await request.makeAuthUrlAsync(discovery);

  const code = await getAuthCode(request);
  if (code === null) {
    // User cancelled / dismissed — not an app error; abort silently.
    return;
  }
  if (__DEV__) console.log("[auth] got code, exchanging via auth service…");

  // Confidential-client exchange happens server-side in the broker (it holds
  // the secret). We never touch the client secret in the app.
  let tokenData: BrokerTokenResponse;
  try {
    tokenData = await exchangeCodeViaBroker(code, redirectUri);
  } catch (e) {
    if (__DEV__) console.log("[auth] BROKER EXCHANGE FAILED →", String(e));
    throw e;
  }
  if (__DEV__) console.log("[auth] exchange OK, hasAccessToken =", !!tokenData.access_token);
  // Diagnoses access_denied causes (unverified email vs consent) during QA.
  if (__DEV__) console.log("[auth] email_verified =", (tokenData.user as { email_verified?: unknown } | undefined)?.email_verified);

  const accessToken = tokenData.access_token;
  await secureStorage.set(TOKEN_KEYS.access, accessToken);
  // The broker does not return a refresh token (web runs a bounded session too).

  // The broker already returns userinfo + user_metadata; build from that, then
  // best-effort hydrate from the Node API for the freshest name/avatar.
  const baseUser = buildUserFromBroker(tokenData);
  const user = await hydrateUserFromNode(baseUser);

  await useAuthStore.getState().setSession(accessToken, user);
  forceLoginForm = false;
  if (__DEV__) console.log("[auth] ✅ session set — logged in as", user?.email ?? user?.sub ?? "?");
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authService = {
  async login(): Promise<void> {
    await performLogin();
  },

  /**
   * Open Auth0 Universal Login in signup mode.
   * screen_hint=signup shows the sign-up form. Social (Google) still shows.
   * No prompt:login — that suppresses social SSO on Universal Login.
   */
  async signup(): Promise<void> {
    await performLogin({ screen_hint: "signup" });
  },

  /**
   * Refresh the access token using the stored refresh token.
   * After a successful refresh, fetches /userinfo to re-hydrate name/avatar
   * (fixes the blank profile header after an app relaunch that refreshes an
   * expired token — previously only performLogin did this hydration).
   */
  async refresh(): Promise<boolean> {
    const refreshToken = await secureStorage.get(TOKEN_KEYS.refresh);
    if (!refreshToken) return false;

    try {
      const tokens = await exchangeRefreshToken(refreshToken);
      await secureStorage.set(TOKEN_KEYS.access, tokens.access_token);

      if (tokens.refresh_token) {
        await secureStorage.set(TOKEN_KEYS.refresh, tokens.refresh_token);
      }

      const claims = decodeJwtPayload(tokens.access_token);
      const currentUser = useAuthStore.getState().user;
      const baseUser: AuthUser = currentUser
        ? { ...currentUser, sub: (claims.sub as string) ?? currentUser.sub }
        : buildUserFromClaims(claims);

      // Hydrate name + avatar from Node (fixes blank header after relaunch).
      const user = await hydrateUserFromNode(baseUser);

      await useAuthStore.getState().setSession(tokens.access_token, user);
      return true;
    } catch {
      await authService.logout();
      return false;
    }
  },

  async ensureValidToken(): Promise<boolean> {
    const token = await secureStorage.get(TOKEN_KEYS.access);
    if (!token) return false;
    if (!isTokenExpired(token)) return true;
    return authService.refresh();
  },

  /**
   * Clear local session then sign out of Auth0.
   *
   * Native: WebBrowser.openAuthSessionAsync → closes the Auth0 session in-browser.
   * Web:    window.location.assign → full redirect (openBrowserAsync never returns on web).
   *
   * returnTo must be registered in Auth0 "Allowed Logout URLs".
   */
  async logout(): Promise<void> {
    // Clear local state first so the UI reacts immediately.
    await useAuthStore.getState().logout();

    const returnTo =
      Platform.OS === "web" && typeof window !== "undefined"
        ? window.location.origin
        : AuthSession.makeRedirectUri({ scheme: "unifind", path: "auth/callback" });

    const logoutUrl = new URL(`https://${AUTH0_DOMAIN}/v2/logout`);
    logoutUrl.searchParams.set("client_id", AUTH0_CLIENT_ID);
    logoutUrl.searchParams.set("returnTo", returnTo);

    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.location.assign(logoutUrl.toString());
        }
      } else {
        // Native: open in-app browser to clear Auth0 session cookie, then return.
        await WebBrowser.openAuthSessionAsync(
          logoutUrl.toString(),
          AuthSession.makeRedirectUri({ scheme: "unifind", path: "auth/callback" })
        );
      }
    } catch {
      // Non-fatal: local session is already cleared above.
    }
  },
};

// ─── Register functions in authStore + nodeApi at module load ─────────────────
// This breaks the circular dep: neither authStore nor nodeApi imports authService.
registerRefreshFn(authService.refresh.bind(authService));
registerNodeApiRefreshFn(authService.refresh.bind(authService));
// Expose hydrateUserFromNode so authStore.bootstrap() can hydrate after a valid
// token restore without importing authService (circular dep).
registerHydrateUserFn(hydrateUserFromNode);

export { isTokenExpired };
