/**
 * Logged-out Profile gate: Sign In / Create Account go straight to Auth0
 * (QA 2026-11-10: they used to open the SignInSheet, which repeats the same
 * two buttons — two taps for one action).
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { SignedOutProfile } from "@/screens/ProfileScreen";
import { authService } from "@/services/authService";
import { useSignInSheetStore } from "@/auth/signInSheetStore";

jest.mock("@/services/authService", () => ({
  authService: { login: jest.fn(async () => undefined), signup: jest.fn(async () => undefined) },
}));
jest.mock("@/stores/toastStore", () => ({ showToast: jest.fn() }));
jest.mock("@/components/ui/alert-dialog", () => ({ confirmAlert: jest.fn() }));
import { AuthDeniedError } from "@/auth/authErrors";
import { confirmAlert } from "@/components/ui/alert-dialog";

describe("SignedOutProfile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Sign In opens Auth0 login directly, not the sheet", async () => {
    render(<SignedOutProfile />);
    fireEvent.press(screen.getByTestId("profile-gate-signin"));
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
    expect(useSignInSheetStore.getState().isOpen).toBe(false);
  });

  it("Create Account opens Auth0 sign-up directly", async () => {
    render(<SignedOutProfile />);
    fireEvent.press(screen.getByTestId("profile-gate-create-account"));
    await waitFor(() => expect(authService.signup).toHaveBeenCalledTimes(1));
  });

  it("a double tap starts only one Auth0 flow", async () => {
    let finish!: () => void;
    (authService.login as jest.Mock).mockImplementationOnce(
      () => new Promise<void>((r) => { finish = r; })
    );
    render(<SignedOutProfile />);
    fireEvent.press(screen.getByTestId("profile-gate-signin"));
    fireEvent.press(screen.getByTestId("profile-gate-signin"));
    finish();
    await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(1));
  });

  it("a failed login shows the loginFailed toast", async () => {
    const { showToast } = jest.requireMock("@/stores/toastStore");
    (authService.login as jest.Mock).mockRejectedValueOnce(new Error("x"));
    render(<SignedOutProfile />);
    fireEvent.press(screen.getByTestId("profile-gate-signin"));
    await waitFor(() => expect(showToast).toHaveBeenCalledWith("loginFailed"));
  });

  describe("Auth0 denied the account (access_denied)", () => {
    // Measured 2026-11-10 on the DEV tenant: an unverified sign-up comes back
    // as error_description "Unauthorized" — Auth0 does not say why.
    it("generic denial: a dialog (not a 2.4 s toast) says the account could not be signed in and hints at verification", async () => {
      const { showToast } = jest.requireMock("@/stores/toastStore");
      (authService.login as jest.Mock).mockRejectedValueOnce(new AuthDeniedError("Unauthorized"));
      render(<SignedOutProfile />);
      fireEvent.press(screen.getByTestId("profile-gate-signin"));
      await waitFor(() =>
        expect(confirmAlert).toHaveBeenCalledWith("loginDeniedTitle", "loginDenied", expect.any(Array))
      );
      expect(showToast).not.toHaveBeenCalled();
    });

    it("a description that names verification gets the explicit verify-email message", async () => {
      (authService.login as jest.Mock).mockRejectedValueOnce(
        new AuthDeniedError("Please verify your email before logging in.")
      );
      render(<SignedOutProfile />);
      fireEvent.press(screen.getByTestId("profile-gate-signin"));
      await waitFor(() =>
        expect(confirmAlert).toHaveBeenCalledWith("loginDeniedTitle", "loginVerifyEmail", expect.any(Array))
      );
    });

    it("the dialog offers Close and Sign in again; Sign in again restarts the login", async () => {
      (authService.login as jest.Mock).mockRejectedValueOnce(new AuthDeniedError("Unauthorized"));
      render(<SignedOutProfile />);
      fireEvent.press(screen.getByTestId("profile-gate-signin"));
      await waitFor(() => expect(confirmAlert).toHaveBeenCalled());
      const actions = (confirmAlert as jest.Mock).mock.calls[0][2];
      expect(actions.map((a: { text: string }) => a.text)).toEqual(["common.close", "signInAgain"]);
      actions[1].onPress();
      await waitFor(() => expect(authService.login).toHaveBeenCalledTimes(2));
    });
  });
});
