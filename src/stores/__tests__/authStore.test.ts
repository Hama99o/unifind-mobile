/**
 * authStore.test.ts — unit tests for the Zustand auth store.
 *
 * The store decodes JWTs (no signature check), persists the access/refresh
 * tokens through `secureStorage` (which, on the default jest-expo platform
 * "ios", wraps the in-memory expo-secure-store mock), and exposes:
 *   setSession, setPicture, setUser, bootstrap, logout
 * plus the module-level injectors registerRefreshFn / registerHydrateUserFn
 * (used to break the authStore↔authService circular dependency).
 *
 * Determinism:
 *   - `isExpired` reads Date.now(); we pin the system clock with fake timers to
 *     2025-06-01T12:00:00Z so token `exp` values are stable.
 *   - Tokens are built at runtime from a payload + that fixed clock.
 *
 * The store has no built-in reset action, so beforeEach restores the initial
 * state via setState(..., true) AND clears the secure-store keys. Injected
 * refresh/hydrate fns are module-level singletons; tests that exercise those
 * branches re-register controlled mocks, and we re-register inert ones in
 * beforeEach so leakage between tests is contained.
 */

import { Buffer } from "buffer";
import {
  useAuthStore,
  registerRefreshFn,
  registerHydrateUserFn,
  type AuthUser,
} from "@/stores/authStore";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";

// Fixed "now" — must match the exp math below.
const NOW = new Date("2025-06-01T12:00:00Z");
const NOW_SECONDS = Math.floor(NOW.getTime() / 1000); // 1748779200

/** base64url-encode a JS object (JWT segment style, no padding). */
function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/** Build a fake JWT (header.payload.signature) with the given claims. */
function makeToken(claims: Record<string, unknown>): string {
  return `h.${b64url(claims)}.sig`;
}

const INITIAL = {
  isLoggedIn: false,
  isBootstrapping: true,
  user: null as AuthUser | null,
  accessToken: null as string | null,
} as const;

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
  // Reset store to a known initial state (replace, not merge — keeps actions).
  useAuthStore.setState({ ...INITIAL });
  // Clear persisted tokens from the in-memory secure store.
  await secureStorage.remove(TOKEN_KEYS.access);
  await secureStorage.remove(TOKEN_KEYS.refresh);
  // Re-register inert injectors so a previous test's mock cannot leak in.
  registerRefreshFn(async () => false);
  registerHydrateUserFn(async (u) => u);
});

afterEach(() => {
  jest.useRealTimers();
});

// ─── initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("is logged out and bootstrapping with no user/token", () => {
    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isBootstrapping).toBe(true);
    expect(s.user).toBeNull();
    expect(s.accessToken).toBeNull();
  });
});

// ─── setSession ─────────────────────────────────────────────────────────────────

describe("setSession", () => {
  it("logs in, stores the token in state and secure storage", async () => {
    const user: AuthUser = { sub: "auth0|abc", userID: "abc", name: "Jane" };
    await useAuthStore.getState().setSession("tok-123", user);

    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(true);
    expect(s.accessToken).toBe("tok-123");
    expect(s.user).toEqual(user);
    // Persisted under the access-token key.
    await expect(secureStorage.get(TOKEN_KEYS.access)).resolves.toBe("tok-123");
  });
});

// ─── setPicture ─────────────────────────────────────────────────────────────────

describe("setPicture", () => {
  it("updates the avatar URL when a user exists", async () => {
    await useAuthStore
      .getState()
      .setSession("t", { sub: "auth0|x", userID: "x", picture: "old.png" });
    useAuthStore.getState().setPicture("new.png");
    expect(useAuthStore.getState().user?.picture).toBe("new.png");
  });

  it("is a no-op when there is no user", () => {
    // initial state: user is null
    useAuthStore.getState().setPicture("orphan.png");
    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ─── setUser ────────────────────────────────────────────────────────────────────

describe("setUser", () => {
  it("merges partial updates into the existing user", async () => {
    await useAuthStore
      .getState()
      .setSession("t", { sub: "auth0|x", userID: "x", name: "Old" });
    useAuthStore.getState().setUser({ name: "New", firstName: "N" });
    const u = useAuthStore.getState().user;
    expect(u?.name).toBe("New");
    expect(u?.firstName).toBe("N");
    // Untouched fields survive the merge.
    expect(u?.sub).toBe("auth0|x");
    expect(u?.userID).toBe("x");
  });

  it("is a no-op when there is no user", () => {
    useAuthStore.getState().setUser({ name: "Nobody" });
    expect(useAuthStore.getState().user).toBeNull();
  });
});

// ─── logout ─────────────────────────────────────────────────────────────────────

describe("logout", () => {
  it("clears state and removes both tokens from secure storage", async () => {
    await secureStorage.set(TOKEN_KEYS.access, "a");
    await secureStorage.set(TOKEN_KEYS.refresh, "r");
    await useAuthStore
      .getState()
      .setSession("a", { sub: "auth0|x", userID: "x" });

    await useAuthStore.getState().logout();

    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
    await expect(secureStorage.get(TOKEN_KEYS.access)).resolves.toBeNull();
    await expect(secureStorage.get(TOKEN_KEYS.refresh)).resolves.toBeNull();
  });
});

// ─── bootstrap ──────────────────────────────────────────────────────────────────

describe("bootstrap", () => {
  it("no token → signs out and finishes bootstrapping", async () => {
    await useAuthStore.getState().bootstrap();
    const s = useAuthStore.getState();
    expect(s.isBootstrapping).toBe(false);
    expect(s.isLoggedIn).toBe(false);
  });

  it("valid (unexpired) token → restores session from decoded claims", async () => {
    const token = makeToken({
      sub: "auth0|user42",
      name: "Jane Doe",
      email: "jane@x.com",
      picture: "http://pic",
      exp: NOW_SECONDS + 3600, // 1h in the future → not expired
    });
    await secureStorage.set(TOKEN_KEYS.access, token);

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.isBootstrapping).toBe(false);
    expect(s.isLoggedIn).toBe(true);
    expect(s.accessToken).toBe(token);
    expect(s.user).toEqual({
      sub: "auth0|user42",
      userID: "user42", // sub split on "|"
      name: "Jane Doe",
      email: "jane@x.com",
      picture: "http://pic",
    });
  });

  it("valid token: async hydrate replaces the user after resolve", async () => {
    const token = makeToken({
      sub: "auth0|hydrateMe",
      exp: NOW_SECONDS + 3600,
    });
    await secureStorage.set(TOKEN_KEYS.access, token);

    const hydrated: AuthUser = {
      sub: "auth0|hydrateMe",
      userID: "hydrateMe",
      name: "Hydrated Name",
      picture: "fresh.png",
    };
    const hydrateFn = jest.fn(async () => hydrated);
    registerHydrateUserFn(hydrateFn);

    await useAuthStore.getState().bootstrap();
    // Let the fire-and-forget hydrate promise settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(hydrateFn).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(hydrated);
  });

  it("valid token: a rejecting hydrate keeps the JWT-decoded user (non-fatal)", async () => {
    const token = makeToken({
      sub: "auth0|keepMe",
      name: "From JWT",
      exp: NOW_SECONDS + 3600,
    });
    await secureStorage.set(TOKEN_KEYS.access, token);

    registerHydrateUserFn(async () => {
      throw new Error("network down");
    });

    await useAuthStore.getState().bootstrap();
    await Promise.resolve();
    await Promise.resolve();

    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(true);
    expect(s.user?.name).toBe("From JWT");
    expect(s.user?.userID).toBe("keepMe");
  });

  it("expired token + refreshToken + refreshFn=true → finishes bootstrapping while logged in", async () => {
    const expired = makeToken({
      sub: "auth0|stale",
      exp: NOW_SECONDS - 3600, // already expired
    });
    await secureStorage.set(TOKEN_KEYS.access, expired);
    await secureStorage.set(TOKEN_KEYS.refresh, "refresh-token");

    // refreshFn is expected to have already called setSession internally; we
    // simulate that side effect, then return true.
    const refreshFn = jest.fn(async () => {
      await useAuthStore
        .getState()
        .setSession("new-token", { sub: "auth0|stale", userID: "stale" });
      return true;
    });
    registerRefreshFn(refreshFn);

    await useAuthStore.getState().bootstrap();

    expect(refreshFn).toHaveBeenCalledTimes(1);
    const s = useAuthStore.getState();
    expect(s.isBootstrapping).toBe(false);
    expect(s.isLoggedIn).toBe(true);
    expect(s.accessToken).toBe("new-token");
  });

  it("expired token + refreshFn=false → clears tokens and signs out", async () => {
    const expired = makeToken({
      sub: "auth0|dead",
      exp: NOW_SECONDS - 10,
    });
    await secureStorage.set(TOKEN_KEYS.access, expired);
    await secureStorage.set(TOKEN_KEYS.refresh, "refresh-token");

    registerRefreshFn(async () => false);

    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.isBootstrapping).toBe(false);
    expect(s.isLoggedIn).toBe(false);
    expect(s.accessToken).toBeNull();
    expect(s.user).toBeNull();
    // Both tokens cleared from storage.
    await expect(secureStorage.get(TOKEN_KEYS.access)).resolves.toBeNull();
    await expect(secureStorage.get(TOKEN_KEYS.refresh)).resolves.toBeNull();
  });

  it("expired token with NO refresh token → clears and signs out (refresh path skipped)", async () => {
    const expired = makeToken({
      sub: "auth0|nrf",
      exp: NOW_SECONDS - 10,
    });
    await secureStorage.set(TOKEN_KEYS.access, expired);
    // no refresh token stored

    const refreshFn = jest.fn(async () => true);
    registerRefreshFn(refreshFn);

    await useAuthStore.getState().bootstrap();

    // refreshFn must NOT run when there is no refresh token.
    expect(refreshFn).not.toHaveBeenCalled();
    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isBootstrapping).toBe(false);
  });

  it("token within the 60s expiry buffer is treated as expired", async () => {
    // exp is 30s in the future, but isExpired uses a 60s buffer, so it counts
    // as expired and we fall through to the (failing) refresh → sign-out path.
    const nearlyExpired = makeToken({
      sub: "auth0|buffer",
      exp: NOW_SECONDS + 30,
    });
    await secureStorage.set(TOKEN_KEYS.access, nearlyExpired);
    await secureStorage.set(TOKEN_KEYS.refresh, "rt");
    registerRefreshFn(async () => false);

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().isLoggedIn).toBe(false);
  });

  it("malformed token (no exp claim) is treated as expired → sign-out", async () => {
    const noExp = makeToken({ sub: "auth0|noexp" }); // exp missing → isExpired true
    await secureStorage.set(TOKEN_KEYS.access, noExp);
    // no refresh token → straight to clear/sign-out
    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isBootstrapping).toBe(false);
  });

  it("garbage (non-JWT) token decodes to empty claims → expired → sign-out", async () => {
    await secureStorage.set(TOKEN_KEYS.access, "not-a-jwt");
    await useAuthStore.getState().bootstrap();

    const s = useAuthStore.getState();
    expect(s.isLoggedIn).toBe(false);
    expect(s.isBootstrapping).toBe(false);
  });

  it("sub without a '|' separator uses the whole sub as userID", async () => {
    const token = makeToken({
      sub: "plainsubject",
      exp: NOW_SECONDS + 3600,
    });
    await secureStorage.set(TOKEN_KEYS.access, token);

    await useAuthStore.getState().bootstrap();

    const u = useAuthStore.getState().user;
    expect(u?.sub).toBe("plainsubject");
    expect(u?.userID).toBe("plainsubject");
  });
});

// ─── profile survives restart ─────────────────────────────────────────────────

describe("user profile after an app restart", () => {
  // QA 2026-11-10: the access token (audience /api/v2/) has no email/name
  // claims, so after a restart a new account's header showed just "Profile".
  it("restores the email/name/picture saved at sign-in when the token has none", async () => {
    const token = makeToken({ sub: "auth0|qa", exp: NOW_SECONDS + 3600 });
    await useAuthStore.getState().setSession(token, {
      sub: "auth0|qa", userID: "qa", email: "qa@x.com", name: "QA", picture: "p.png",
    });
    useAuthStore.setState({ ...INITIAL }); // "restart"
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().user).toMatchObject({
      sub: "auth0|qa", email: "qa@x.com", name: "QA", picture: "p.png",
    });
  });

  it("forgets the saved profile on logout", async () => {
    const token = makeToken({ sub: "auth0|qa", exp: NOW_SECONDS + 3600 });
    await useAuthStore.getState().setSession(token, { sub: "auth0|qa", userID: "qa", email: "qa@x.com" });
    await useAuthStore.getState().logout();
    const other = makeToken({ sub: "auth0|other", exp: NOW_SECONDS + 3600 });
    await secureStorage.set(TOKEN_KEYS.access, other);
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().user?.email).toBeUndefined();
  });

  it("ignores a saved profile that belongs to another account", async () => {
    const token = makeToken({ sub: "auth0|qa", exp: NOW_SECONDS + 3600 });
    await useAuthStore.getState().setSession(token, { sub: "auth0|qa", userID: "qa", email: "qa@x.com" });
    await secureStorage.set(TOKEN_KEYS.access, makeToken({ sub: "auth0|other", exp: NOW_SECONDS + 3600 }));
    useAuthStore.setState({ ...INITIAL });
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().user?.email).toBeUndefined();
  });
});
