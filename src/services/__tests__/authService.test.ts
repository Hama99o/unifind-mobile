/**
 * authService.test.ts — unit tests for the Auth0 PKCE orchestration service.
 *
 * expo-auth-session, expo-web-browser, expo-crypto and expo-secure-store are
 * globally mocked (jest.setup.ts). nodeApi is globally mocked. We override the
 * AuthRequest / exchangeCodeAsync mocks per test to drive the login flow, and
 * mock global.fetch for the refresh-token exchange.
 *
 * Coverage:
 *   isTokenExpired   — valid token, expired token, malformed token (no payload).
 *   fetchNodeUserInfo — success, null on empty body, null on error.
 *   login            — happy path: tokens persisted, session set; user built
 *                      from idToken claims + merged with Node /userinfo.
 *   login            — cancel/dismiss path: silent abort, no tokens stored.
 *   login            — Auth0 error result throws.
 *   login            — success but missing code throws.
 *   signup           — passes screen_hint=signup to the AuthRequest.
 *   refresh          — no refresh token → false.
 *   refresh          — happy path: new tokens persisted, session set, true.
 *   refresh          — rotates refresh token when a new one is returned.
 *   refresh          — failure (non-ok fetch) → logout + false.
 *   ensureValidToken — no token → false; valid token → true; expired → refresh.
 *   logout           — clears local session.
 */

import { authService, isTokenExpired, fetchNodeUserInfo } from "@/services/authService";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import { nodeApi } from "@/api/nodeApi";
import { useAuthStore } from "@/stores/authStore";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build an unsigned JWT (header.payload.sig) whose payload base64-decodes. */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = Buffer.from(JSON.stringify(payload))
    .toString("base64")
    .replace(/=+$/, "");
  return `h.${b64}.s`;
}

const FUTURE_EXP = 9999999999; // year 2286 — never expired
const PAST_EXP = 1; // 1970 — always expired

/** Snapshot of the pristine auth store state for reset between tests. */
const INITIAL_AUTH_STATE = {
  isLoggedIn: false,
  isBootstrapping: true,
  user: null,
  accessToken: null,
};

const realFetch = global.fetch;

beforeEach(async () => {
  jest.clearAllMocks();
  // Reset auth store (keep the action functions, reset the data fields).
  useAuthStore.setState({ ...INITIAL_AUTH_STATE });
  // Clear secure storage token keys (in-memory mock persists across tests).
  await secureStorage.remove(TOKEN_KEYS.access);
  await secureStorage.remove(TOKEN_KEYS.refresh);
});

afterEach(() => {
  global.fetch = realFetch;
});

// ─── isTokenExpired ─────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  it("returns false for a token with a far-future exp", () => {
    expect(isTokenExpired(makeJwt({ exp: FUTURE_EXP }))).toBe(false);
  });

  it("returns true for a token with a past exp", () => {
    expect(isTokenExpired(makeJwt({ exp: PAST_EXP }))).toBe(true);
  });

  it("returns true for a malformed token (no decodable payload, exp defaults to 0)", () => {
    // "no-dots" has no [1] segment → decode returns {} → exp = 0 → expired.
    expect(isTokenExpired("no-dots")).toBe(true);
  });

  it("respects the buffer: a token expiring within the buffer counts as expired", () => {
    const nowSec = Math.floor(Date.now() / 1000);
    // exp 30s in the future, default buffer 60s → treated as expired.
    expect(isTokenExpired(makeJwt({ exp: nowSec + 30 }))).toBe(true);
  });
});

// ─── fetchNodeUserInfo ──────────────────────────────────────────────────────

describe("fetchNodeUserInfo", () => {
  it("returns the nested data object on success", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: { firstName: "Jane", lastName: "Doe", photo: "p.png" } },
    });
    const info = await fetchNodeUserInfo();
    expect(info).toEqual({ firstName: "Jane", lastName: "Doe", photo: "p.png" });
    expect(nodeApi.get).toHaveBeenCalledWith("/userinfo");
  });

  it("returns null when the response body has no data field", async () => {
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });
    expect(await fetchNodeUserInfo()).toBeNull();
  });

  it("returns null when the request throws", async () => {
    (nodeApi.get as jest.Mock).mockRejectedValueOnce(new Error("network"));
    expect(await fetchNodeUserInfo()).toBeNull();
  });
});

// ─── login (success path) ────────────────────────────────────────────────────

describe("authService.login", () => {
  /** Drive AuthRequest.promptAsync → success with a code, and a known codeVerifier. */
  function mockSuccessfulPrompt(code = "auth-code-123") {
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      () => ({
        promptAsync: jest.fn(async () => ({
          type: "success",
          params: { code },
        })),
        makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
        codeVerifier: "verifier-xyz",
        state: "state-xyz",
      })
    );
  }

  /** Mock the broker (/api/google-signin) code→token exchange via global.fetch. */
  function mockBroker(body: Record<string, unknown>) {
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => body,
    })) as unknown as typeof fetch;
  }

  it("exchanges the code via the broker and sets the session, merging broker userinfo with Node /userinfo", async () => {
    mockSuccessfulPrompt();
    mockBroker({
      access_token: "ACCESS-TOK",
      user: {
        sub: "auth0|abc123",
        name: "Claims Name",
        email: "claims@x.com",
        picture: "https://claims/pic.png",
      },
      user_metadata: {},
    });
    // Node /userinfo overrides name (firstName+lastName) and picture (photo).
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({
      data: { data: { firstName: "Node", lastName: "User", photo: "https://node/pic.png" } },
    });

    await authService.login();

    // The broker endpoint was called with the code + redirect_uri.
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/google-signin"),
      expect.objectContaining({ method: "POST" })
    );

    // Access token persisted; no refresh token in this flow.
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBe("ACCESS-TOK");
    expect(await secureStorage.get(TOKEN_KEYS.refresh)).toBeNull();

    // Session set in the store.
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.accessToken).toBe("ACCESS-TOK");
    expect(state.user).toEqual({
      sub: "auth0|abc123",
      userID: "abc123", // sub split on "|"
      name: "Node User", // node fullName overrides broker name
      email: "claims@x.com", // email from broker userinfo
      picture: "https://node/pic.png", // node photo overrides broker picture
    });
  });

  it("keeps the broker values when Node /userinfo is unavailable", async () => {
    mockSuccessfulPrompt();
    mockBroker({
      access_token: "A2",
      user: {
        sub: "auth0|solo",
        name: "Only Claims",
        email: "solo@x.com",
        picture: "https://claims/solo.png",
      },
      user_metadata: null,
    });
    // Node /userinfo returns nothing → hydrate keeps base user.
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    await authService.login();

    expect(useAuthStore.getState().user).toEqual({
      sub: "auth0|solo",
      userID: "solo",
      name: "Only Claims",
      email: "solo@x.com",
      picture: "https://claims/solo.png",
    });
  });

  it("prefers user_metadata first/last name over the broker userinfo name", async () => {
    mockSuccessfulPrompt();
    mockBroker({
      access_token: "A3",
      user: { sub: "auth0|meta", name: "Ignored Name", email: "m@x.com" },
      user_metadata: { first_name: "Meta", last_name: "Name" },
    });
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    await authService.login();

    expect(useAuthStore.getState().user?.name).toBe("Meta Name");
  });

  it("throws (surfacing a toast upstream) when the broker exchange fails", async () => {
    mockSuccessfulPrompt();
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    })) as unknown as typeof fetch;

    await expect(authService.login()).rejects.toThrow("token exchange failed");
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBeNull();
  });

  it("silently aborts on a cancel/dismiss result without storing tokens or a session", async () => {
    // The default global AuthRequest mock already resolves promptAsync → { type: "cancel" }.
    await expect(authService.login()).resolves.toBeUndefined();

    expect(AuthSession.exchangeCodeAsync).not.toHaveBeenCalled();
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBeNull();
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });

  it("completes login via the deep-link fallback when promptAsync never resolves with the code", async () => {
    // Simulate the real-device bug: the OS delivers the redirect deep link to
    // the app instead of the auth-session browser, so promptAsync never yields
    // the code. The Linking listener must capture it and finish the exchange.
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      () => ({
        // Never resolves — mirrors ASWebAuthenticationSession hanging.
        promptAsync: jest.fn(() => new Promise(() => {})),
        makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
        codeVerifier: "verifier-deep",
        state: "state-deep",
      })
    );
    // The listener fires as soon as it is registered, delivering the callback URL.
    (Linking.addEventListener as jest.Mock).mockImplementationOnce(
      (_event: string, handler: (e: { url: string }) => void) => {
        handler({ url: "unifind://auth/callback?code=deep-code&state=state-deep" });
        return { remove: jest.fn() };
      }
    );
    let brokerBody: string | undefined;
    global.fetch = jest.fn(async (_url: string, init: { body?: string }) => {
      brokerBody = init?.body;
      return {
        ok: true,
        json: async () => ({
          access_token: "DEEP-ACCESS",
          user: { sub: "auth0|deep" },
          user_metadata: {},
        }),
      };
    }) as unknown as typeof fetch;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    await authService.login();

    // The code captured from the deep link was sent to the broker.
    expect(brokerBody).toContain("deep-code");
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBe("DEEP-ACCESS");
    expect(useAuthStore.getState().isLoggedIn).toBe(true);
  });

  it("rejects a deep-link callback whose state does not match the request", async () => {
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      () => ({
        promptAsync: jest.fn(() => new Promise(() => {})),
        makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
        codeVerifier: "v",
        state: "expected-state",
      })
    );
    (Linking.addEventListener as jest.Mock).mockImplementationOnce(
      (_event: string, handler: (e: { url: string }) => void) => {
        handler({ url: "unifind://auth/callback?code=x&state=WRONG-state" });
        return { remove: jest.fn() };
      }
    );

    await expect(authService.login()).rejects.toThrow("state mismatch");
    expect(AuthSession.exchangeCodeAsync).not.toHaveBeenCalled();
  });

  it("throws when the result is an error with a description", async () => {
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      () => ({
        promptAsync: jest.fn(async () => ({
          type: "error",
          error: { description: "access_denied" },
        })),
        makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
        codeVerifier: "v",
        state: "s",
      })
    );
    await expect(authService.login()).rejects.toThrow("Auth0 error: access_denied");
  });

  it("throws when a success result has no authorization code", async () => {
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      () => ({
        promptAsync: jest.fn(async () => ({ type: "success", params: {} })),
        makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
        codeVerifier: "v",
        state: "s",
      })
    );
    await expect(authService.login()).rejects.toThrow(
      "Authorization code not found in Auth0 callback"
    );
  });
});

// ─── account switch after a denial ───────────────────────────────────────────

describe("authService.login after Auth0 denied the account", () => {
  /** AuthRequest mock that records extraParams and resolves with `result`. */
  const mockRequest = (result: unknown, seen: Array<Record<string, string> | undefined>) =>
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      (config: { extraParams?: Record<string, string> }) => {
        seen.push(config.extraParams);
        return {
          promptAsync: jest.fn(async () => result),
          makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
          codeVerifier: "v",
          state: "s",
        };
      }
    );
  const denied = {
    type: "error",
    error: { code: "access_denied", description: "Unauthorized" },
    params: { error: "access_denied" },
  };

  it("forces the login form (prompt=login) on the next attempt, so the user can switch account", async () => {
    // QA 2026-11-10: the Auth0 SSO cookie kept auto-submitting the denied
    // account, so every later Sign In failed without ever showing the form.
    const seen: Array<Record<string, string> | undefined> = [];
    mockRequest(denied, seen);
    await expect(authService.login()).rejects.toThrow("Unauthorized");
    mockRequest({ type: "cancel" }, seen);
    await authService.login();
    expect(seen[0]?.prompt).toBeUndefined();
    expect(seen[1]?.prompt).toBe("login");
  });

  it("keeps forcing the form until a login gets through (a cancel does not reset it)", async () => {
    const seen: Array<Record<string, string> | undefined> = [];
    mockRequest(denied, seen);
    await expect(authService.login()).rejects.toThrow();
    mockRequest({ type: "cancel" }, seen);
    await authService.login();
    mockRequest({ type: "cancel" }, seen);
    await authService.signup();
    expect(seen[1]?.prompt).toBe("login");
    expect(seen[2]?.prompt).toBe("login");
    expect(seen[2]?.screen_hint).toBe("signup");
  });
});

// ─── signup ────────────────────────────────────────────────────────────────

describe("authService.signup", () => {
  it("constructs the AuthRequest with screen_hint=signup in extraParams", async () => {
    // Capture the config passed to AuthRequest, then cancel (default behaviour).
    let capturedConfig: { extraParams?: Record<string, string> } | undefined;
    (AuthSession.AuthRequest as unknown as jest.Mock).mockImplementationOnce(
      (config: { extraParams?: Record<string, string> }) => {
        capturedConfig = config;
        return {
          promptAsync: jest.fn(async () => ({ type: "cancel" })),
          makeAuthUrlAsync: jest.fn(async () => "https://mock.auth/"),
          codeVerifier: "v",
          state: "s",
        };
      }
    );

    await authService.signup();

    expect(capturedConfig?.extraParams?.screen_hint).toBe("signup");
  });
});

// ─── refresh ──────────────────────────────────────────────────────────────

describe("authService.refresh", () => {
  it("returns false when there is no stored refresh token", async () => {
    expect(await authService.refresh()).toBe(false);
    expect(global.fetch).toBe(realFetch); // fetch never replaced/called
  });

  it("exchanges the refresh token, persists new tokens and sets the session", async () => {
    await secureStorage.set(TOKEN_KEYS.refresh, "OLD-REFRESH");
    const newAccess = makeJwt({ sub: "auth0|refreshed", exp: FUTURE_EXP });
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: newAccess }),
    })) as unknown as typeof fetch;
    // hydrateUserFromNode → /userinfo returns nothing → base user kept.
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    const ok = await authService.refresh();

    expect(ok).toBe(true);
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBe(newAccess);
    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(true);
    expect(state.accessToken).toBe(newAccess);
    expect(state.user?.sub).toBe("auth0|refreshed");
    expect(state.user?.userID).toBe("refreshed");
  });

  it("rotates the refresh token when the response includes a new one", async () => {
    await secureStorage.set(TOKEN_KEYS.refresh, "OLD-REFRESH");
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        access_token: makeJwt({ sub: "x", exp: FUTURE_EXP }),
        refresh_token: "NEW-REFRESH",
      }),
    })) as unknown as typeof fetch;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    await authService.refresh();

    expect(await secureStorage.get(TOKEN_KEYS.refresh)).toBe("NEW-REFRESH");
  });

  it("preserves the existing store user (merging the new sub) on refresh", async () => {
    // Seed a logged-in user; refresh should merge claims.sub onto it.
    useAuthStore.setState({
      isLoggedIn: true,
      accessToken: "old",
      user: {
        sub: "auth0|original",
        userID: "original",
        name: "Existing User",
        email: "existing@x.com",
        picture: "https://existing/pic.png",
      },
    });
    await secureStorage.set(TOKEN_KEYS.refresh, "OLD-REFRESH");
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ access_token: makeJwt({ sub: "auth0|newsub", exp: FUTURE_EXP }) }),
    })) as unknown as typeof fetch;
    (nodeApi.get as jest.Mock).mockResolvedValueOnce({ data: {} });

    await authService.refresh();

    const user = useAuthStore.getState().user;
    expect(user?.name).toBe("Existing User"); // preserved from prior user
    expect(user?.sub).toBe("auth0|newsub"); // overwritten with new claim sub
  });

  it("logs out and returns false when the token exchange fails", async () => {
    useAuthStore.setState({ isLoggedIn: true, accessToken: "old", user: { sub: "s", userID: "s" } });
    await secureStorage.set(TOKEN_KEYS.access, "old-access");
    await secureStorage.set(TOKEN_KEYS.refresh, "OLD-REFRESH");
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => "invalid_grant",
    })) as unknown as typeof fetch;

    const ok = await authService.refresh();

    expect(ok).toBe(false);
    // logout() cleared local session + tokens.
    expect(useAuthStore.getState().isLoggedIn).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBeNull();
    expect(await secureStorage.get(TOKEN_KEYS.refresh)).toBeNull();
  });
});

// ─── ensureValidToken ────────────────────────────────────────────────────────

describe("authService.ensureValidToken", () => {
  it("returns false when there is no access token", async () => {
    expect(await authService.ensureValidToken()).toBe(false);
  });

  it("returns true when the stored token is still valid (no refresh attempted)", async () => {
    await secureStorage.set(TOKEN_KEYS.access, makeJwt({ sub: "s", exp: FUTURE_EXP }));
    const refreshSpy = jest.spyOn(authService, "refresh");
    expect(await authService.ensureValidToken()).toBe(true);
    expect(refreshSpy).not.toHaveBeenCalled();
    refreshSpy.mockRestore();
  });

  it("delegates to refresh when the stored token is expired", async () => {
    await secureStorage.set(TOKEN_KEYS.access, makeJwt({ sub: "s", exp: PAST_EXP }));
    // No refresh token stored → refresh returns false.
    expect(await authService.ensureValidToken()).toBe(false);
  });
});

// ─── logout ────────────────────────────────────────────────────────────────

describe("authService.logout", () => {
  it("clears the local session and stored tokens", async () => {
    useAuthStore.setState({
      isLoggedIn: true,
      accessToken: "a",
      user: { sub: "s", userID: "s" },
    });
    await secureStorage.set(TOKEN_KEYS.access, "a");
    await secureStorage.set(TOKEN_KEYS.refresh, "r");

    await authService.logout();

    const state = useAuthStore.getState();
    expect(state.isLoggedIn).toBe(false);
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(await secureStorage.get(TOKEN_KEYS.access)).toBeNull();
    expect(await secureStorage.get(TOKEN_KEYS.refresh)).toBeNull();
  });
});
