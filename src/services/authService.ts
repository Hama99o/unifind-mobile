/**
 * authService — Auth0 PKCE flow orchestration (canonical expo-auth-session).
 *
 * Uses expo-auth-session's built-in AuthRequest which manages PKCE code verifier,
 * code challenge, and state internally — no hand-rolled SHA-256/base64.
 *
 * Flow:
 *   1. new AuthRequest({ ... , usePKCE: true })
 *   2. request.promptAsync(discovery) — opens browser; handles popup on web, in-app browser on native
 *   3. On success, exchangeCodeAsync({ code, codeVerifier: request.codeVerifier! }, discovery)
 *   4. Store tokens, decode idToken, setSession, merge from Node /userinfo
 *
 * Web redirect: ${origin}/auth/callback — stable popup URL.
 * Native redirect: unifind://auth/callback
 *
 * Auth0 dashboard must allow:
 *   Allowed Callback URLs: http://localhost:3010/auth/callback, unifind://auth/callback
 *   Allowed Logout URLs:   http://localhost:3010, unifind://auth/callback
 *
 * See AUTH_SECURITY.md §2-§5.
 */

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
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

/** Auth0 OpenID Connect discovery document (standard endpoints). */
const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
  revocationEndpoint: `https://${AUTH0_DOMAIN}/oauth/revoke`,
  endSessionEndpoint: `https://${AUTH0_DOMAIN}/v2/logout`,
};

const SCOPES = ["openid", "profile", "email", "offline_access"];

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

// ─── Core login / signup flow ─────────────────────────────────────────────────

/**
 * Runs the Authorization Code + PKCE flow using expo-auth-session's AuthRequest.
 * AuthRequest manages the PKCE code verifier/challenge and state internally —
 * no manual SHA-256 or base64 needed (fixes the unreliable hand-rolled challenge).
 *
 * On web: opens a popup via window.open(); the popup navigates to
 *         ${origin}/auth/callback which calls maybeCompleteAuthSession() to
 *         hand the code back to the opener. No redirect race.
 *
 * On native: opens an in-app browser (SFSafariViewController / Custom Tabs)
 *            which redirects to unifind://auth/callback.
 */
async function performLogin(extraParams?: Record<string, string>): Promise<void> {
  const redirectUri = getRedirectUri();

  const request = new AuthSession.AuthRequest({
    clientId: AUTH0_CLIENT_ID,
    scopes: SCOPES,
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
    extraParams: {
      audience: AUTH0_AUDIENCE,
      ...extraParams,
    },
  });

  const result = await request.promptAsync(discovery);
  if (__DEV__) console.log("[auth] promptAsync.type =", result.type);

  if (result.type !== "success") {
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
    // Dismiss / cancel / error — not an app error; just abort silently.
    if (result.type === "error" && result.error) {
      const desc =
        typeof result.error === "object" && result.error !== null
          ? ((result.error as { description?: string }).description ?? "Unknown Auth0 error")
          : String(result.error);
      throw new Error(`Auth0 error: ${desc}`);
    }
    return;
  }

  const code = result.params.code;
  if (!code) {
    throw new Error("Authorization code not found in Auth0 callback");
  }
  if (__DEV__) console.log("[auth] got code, exchanging for tokens…");

  // AuthRequest validated state internally; proceed to token exchange.
  let tokenResponse: AuthSession.TokenResponse;
  try {
    tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: AUTH0_CLIENT_ID,
        code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier!,
        },
      },
      discovery
    );
  } catch (e) {
    if (__DEV__) console.log("[auth] TOKEN EXCHANGE FAILED →", JSON.stringify(e), String(e));
    throw e;
  }
  if (__DEV__) console.log("[auth] token exchange OK, hasAccessToken =", !!tokenResponse.accessToken);

  const accessToken = tokenResponse.accessToken;
  const refreshToken = tokenResponse.refreshToken;
  const idToken = tokenResponse.idToken;

  await secureStorage.set(TOKEN_KEYS.access, accessToken);
  if (refreshToken) {
    await secureStorage.set(TOKEN_KEYS.refresh, refreshToken);
  }

  // Prefer idToken for claims (has name/email/picture from OIDC); fall back to accessToken.
  const claims = decodeJwtPayload(idToken ?? accessToken);
  const baseUser = buildUserFromClaims(claims);
  const user = await hydrateUserFromNode(baseUser);

  await useAuthStore.getState().setSession(accessToken, user);
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
