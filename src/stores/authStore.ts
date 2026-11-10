/**
 * authStore — Auth state (Zustand).
 *
 * Exposes: isLoggedIn, isBootstrapping, user, accessToken.
 * Actions: setSession, setPicture, setUser, bootstrap, logout.
 *
 * Bootstrap (called once on app launch in app/_layout.tsx):
 *   - Hydrates from secure-store.
 *   - If token present + not expired → restore session.
 *   - If token expired → delegate to refreshFn (injected by authService at boot).
 *   - Sets isBootstrapping = false when done.
 *
 * Token lifecycle details: see AUTH_SECURITY.md §2.
 *
 * Circular-dep note: authStore must NOT import authService (authService imports authStore).
 * Instead, authService registers a refreshFn + hydrateUserFn via the register* helpers.
 */

import { create } from "zustand";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";

export interface AuthUser {
  sub: string;
  /** Auth0 sub without the "auth0|" prefix — mirrors web's userID derivation */
  userID: string;
  name?: string;
  email?: string;
  picture?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  user: AuthUser | null;
  accessToken: string | null;

  setSession: (token: string, user: AuthUser) => Promise<void>;
  setPicture: (url: string) => void;
  setUser: (updates: Partial<AuthUser>) => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Injected functions (break circular dep) ──────────────────────────────────

/** Registered by authService on first import — triggers a silent token refresh. */
let _refreshFn: (() => Promise<boolean>) | null = null;

export function registerRefreshFn(fn: () => Promise<boolean>) {
  _refreshFn = fn;
}

/**
 * Registered by authService on first import — fetches /userinfo from Node and
 * returns updated AuthUser. Allows bootstrap to hydrate name/avatar after a
 * token refresh without importing authService (circular dep).
 */
let _hydrateUserFn: ((base: AuthUser) => Promise<AuthUser>) | null = null;

export function registerHydrateUserFn(fn: (base: AuthUser) => Promise<AuthUser>) {
  _hydrateUserFn = fn;
}

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/** Decode JWT payload without verification (claims only). */
function decodePayload(token: string): Record<string, unknown> {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isExpired(token: string, bufferSeconds = 60): boolean {
  const exp = decodePayload(token).exp;
  if (typeof exp !== "number") return true;
  return Date.now() / 1000 >= exp - bufferSeconds;
}

function buildUser(payload: Record<string, unknown>): AuthUser {
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

// ─── Saved profile (display fields only) ─────────────────────────────────────
// The access token (audience /api/v2/) carries no email/name claims, so after
// an app restart a new account (nothing in Node user info yet) had a header
// that said just "Profile". Save the display fields at sign-in; never secrets.
const USER_KEY = "uf.user";
type SavedProfile = Pick<AuthUser, "sub" | "name" | "email" | "picture">;

async function readSavedProfile(sub: string): Promise<Partial<AuthUser>> {
  try {
    const raw = await secureStorage.get(USER_KEY);
    const saved = raw ? (JSON.parse(raw) as SavedProfile) : null;
    if (!saved || saved.sub !== sub) return {};
    return { name: saved.name, email: saved.email, picture: saved.picture };
  } catch {
    return {};
  }
}

/** Claims win when present; the saved profile fills the gaps. */
function withSaved(user: AuthUser, saved: Partial<AuthUser>): AuthUser {
  return {
    ...user,
    name: user.name ?? saved.name,
    email: user.email ?? saved.email,
    picture: user.picture ?? saved.picture,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isBootstrapping: true,
  user: null,
  accessToken: null,

  setSession: async (token, user) => {
    await secureStorage.set(TOKEN_KEYS.access, token);
    const saved: SavedProfile = { sub: user.sub, name: user.name, email: user.email, picture: user.picture };
    await secureStorage.set(USER_KEY, JSON.stringify(saved));
    set({ isLoggedIn: true, accessToken: token, user });
  },

  setPicture: (url) =>
    set((s) => (s.user ? { user: { ...s.user, picture: url } } : s)),

  setUser: (updates) =>
    set((s) => (s.user ? { user: { ...s.user, ...updates } } : s)),

  bootstrap: async () => {
    try {
      const token = await secureStorage.get(TOKEN_KEYS.access);

      if (!token) {
        set({ isBootstrapping: false, isLoggedIn: false });
        return;
      }

      if (!isExpired(token)) {
        // Token is still valid — restore session from decoded claims.
        // Best-effort hydrate from Node /userinfo so name/avatar are fresh
        // (avoids blank header when the app reopens with a still-valid token).
        const payload = decodePayload(token);
        const claims = buildUser(payload);
        let user = withSaved(claims, await readSavedProfile(claims.sub));
        set({ isLoggedIn: true, accessToken: token, user, isBootstrapping: false });

        // Hydrate asynchronously; do not block bootstrap completion.
        if (_hydrateUserFn) {
          _hydrateUserFn(user)
            .then((hydrated) => {
              set({ user: hydrated });
            })
            .catch(() => {
              // Non-fatal — keep the JWT-decoded user.
            });
        }
        return;
      }

      // Token expired — try refresh (via injected refreshFn from authService).
      const refreshToken = await secureStorage.get(TOKEN_KEYS.refresh);
      if (refreshToken && _refreshFn) {
        const refreshed = await _refreshFn();
        if (refreshed) {
          // refresh() already called setSession + hydrated user via hydrateUserFromNode.
          set({ isBootstrapping: false });
          return;
        }
      }

      // No valid token — clear and sign out.
      await secureStorage.remove(TOKEN_KEYS.access);
      await secureStorage.remove(TOKEN_KEYS.refresh);
      await secureStorage.remove(USER_KEY);
      set({ isLoggedIn: false, accessToken: null, user: null, isBootstrapping: false });
    } catch {
      set({ isBootstrapping: false, isLoggedIn: false });
    }
  },

  logout: async () => {
    await secureStorage.remove(TOKEN_KEYS.access);
    await secureStorage.remove(TOKEN_KEYS.refresh);
    await secureStorage.remove(USER_KEY);
    set({ isLoggedIn: false, accessToken: null, user: null });
  },
}));
