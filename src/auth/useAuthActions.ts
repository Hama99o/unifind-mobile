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
import { confirmAlert } from "@/components/ui/alert-dialog";
import { AuthDeniedError } from "@/auth/authErrors";

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
    } catch (e) {
      if (e instanceof AuthDeniedError) {
        // A dialog, not a 2.4 s toast: the user has to act on it (verify the
        // email) and may want to retry — the retry shows the login form.
        confirmAlert(
          t("loginDeniedTitle"),
          t(e.isUnverifiedEmail ? "loginVerifyEmail" : "loginDenied"),
          [
            { text: t("common.close"), style: "cancel" },
            { text: t("signInAgain"), onPress: () => void run(which) },
          ]
        );
      } else {
        showToast(t("loginFailed"));
      }
    } finally {
      running.current = false;
      setBusy(null);
    }
  };

  return { busy, signIn: () => run("in"), createAccount: () => run("up") };
}
