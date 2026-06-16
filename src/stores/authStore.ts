import { create } from "zustand";
import { secureStorage, TOKEN_KEYS } from "@/utils/secure-storage";

export interface AuthUser {
  sub: string;
  userID: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface AuthState {
  isLoggedIn: boolean;
  isBootstrapping: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  setPicture: (url: string) => void;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
}

/** Auth state. Token lifecycle detail lives in AUTH_SECURITY.md.
 * TODO(auth-login): wire Auth0 PKCE login + refresh into authService. */
export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  isBootstrapping: true,
  user: null,
  accessToken: null,

  setSession: async (token, user) => {
    await secureStorage.set(TOKEN_KEYS.access, token);
    set({ isLoggedIn: true, accessToken: token, user });
  },

  setPicture: (url) =>
    set((s) => (s.user ? { user: { ...s.user, picture: url } } : s)),

  bootstrap: async () => {
    const token = await secureStorage.get(TOKEN_KEYS.access);
    set({ accessToken: token, isLoggedIn: !!token, isBootstrapping: false });
  },

  logout: async () => {
    await secureStorage.remove(TOKEN_KEYS.access);
    await secureStorage.remove(TOKEN_KEYS.refresh);
    set({ isLoggedIn: false, accessToken: null, user: null });
  },
}));
