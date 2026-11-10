/**
 * useAuthActions — start the Auth0 login / sign-up flow from any button.
 *
 * One flow at a time (double taps are ignored) and failures surface as the
 * loginFailed toast instead of an unhandled rejection. Cancel/dismiss does
 * not throw. Shared by the SignInSheet and the logged-out Profile gate.
 */
import { useRef, useState } from "react";
import { authService } from "@/services/authService";
import { showToast } from "@/stores/toastStore";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";

export type AuthAction = "in" | "up";

export function useAuthActions(onDone?: () => void) {
  const { t } = useCustomTranslation();
  const [busy, setBusy] = useState<null | AuthAction>(null);
  // A ref, not state: two taps in the same frame both see the old state.
  const running = useRef(false);

  const run = async (which: AuthAction) => {
    if (running.current) return;
    running.current = true;
    setBusy(which);
    try {
      await (which === "in" ? authService.login() : authService.signup());
      onDone?.();
    } catch {
      showToast(t("loginFailed"));
    } finally {
      running.current = false;
      setBusy(null);
    }
  };

  return { busy, signIn: () => run("in"), createAccount: () => run("up") };
}
