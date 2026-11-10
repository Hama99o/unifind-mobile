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
});
