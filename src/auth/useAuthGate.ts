/**
 * useAuthGate — auth gate hook for protected actions.
 *
 * Returns `requireAuth(action)`:
 *   - If the user is logged in → runs action() immediately.
 *   - If logged out → opens the SignInSheet; action is NOT resumed
 *     (mirrors web behaviour: gate opens modal, user must re-trigger after login).
 *
 * Usage:
 *   const { requireAuth } = useAuthGate();
 *   const handleFavorite = () => requireAuth(() => toggleFavorite(id));
 *
 * AUTH_SECURITY.md §2: "present SignInSheet when logged out".
 */

import { useAuthStore } from "@/stores/authStore";
import { useSignInSheet } from "./useSignInSheet";

export function useAuthGate() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { open } = useSignInSheet();

  /**
   * Run `action` if logged in; else open the SignInSheet.
   * The action is NOT queued — user must re-trigger after login.
   */
  const requireAuth = (action: () => void | Promise<void>) => {
    if (isLoggedIn) {
      action();
    } else {
      open();
    }
  };

  return { requireAuth, isLoggedIn };
}
