/**
 * useTokenForegroundRefresh — refresh the Auth0 access token when the app
 * comes back to the foreground (AppState change: background → active).
 *
 * Mount once in app/_layout.tsx after bootstrap completes.
 * AUTH_SECURITY.md §2: "refresh on app foreground".
 */

import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/services/authService";

export function useTokenForegroundRefresh() {
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const wasBackground =
        appState.current === "background" || appState.current === "inactive";
      const nowActive = nextState === "active";

      if (wasBackground && nowActive && useAuthStore.getState().isLoggedIn) {
        // Non-blocking — fire and forget; refresh() handles sign-out on failure
        authService.ensureValidToken().catch(() => {});
      }

      appState.current = nextState;
    });

    return () => subscription.remove();
  }, []);
}
