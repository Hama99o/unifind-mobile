import { useAuthStore } from "@/stores/authStore";

/**
 * Auth orchestration (login / refresh / logout). Multi-step flows live in the
 * service layer, never inline in screens. See AUTH_SECURITY.md.
 *
 * TODO(auth-login): implement the Auth0 PKCE native flow with expo-auth-session
 * (or react-native-auth0): exchange code → tokens, decode claims, persist via
 * authStore.setSession, schedule refresh, and clear on logout.
 */
export const authService = {
  async login(): Promise<void> {
    throw new Error("auth-login not implemented yet — see docs/prompts/AUTH_SECURITY.md");
  },
  async refresh(): Promise<void> {
    /* refresh access token near expiry / on foreground */
  },
  async logout(): Promise<void> {
    await useAuthStore.getState().logout();
  },
};
