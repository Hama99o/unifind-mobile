/**
 * DeleteAccountSection — issue #9 (Apple 5.1.1(v), Google Play): confirm,
 * DELETE /users/me, sign out, go home; a failed call shows a toast and keeps
 * the session.
 */
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import { DeleteAccountSection } from "@/screens/profile/tabs/DeleteAccountSection";
import { _registerAlertDialogShow, type AlertAction } from "@/components/ui/alert-dialog";
import { nodeApi } from "@/api/nodeApi";
import { authService } from "@/services/authService";
import * as toastStore from "@/stores/toastStore";

let confirm: "destructive" | "cancel" = "destructive";

beforeEach(() => {
  jest.clearAllMocks();
  confirm = "destructive";
  _registerAlertDialogShow(({ actions }: { actions?: AlertAction[] }) => {
    actions?.find((a) => a.style === confirm)?.onPress?.();
  });
});

describe("DeleteAccountSection", () => {
  it("deletes the account, signs out and returns to home", async () => {
    const logout = jest.spyOn(authService, "logout").mockResolvedValue(undefined);
    render(<DeleteAccountSection />);
    fireEvent.press(screen.getByTestId("profile-delete-account"));

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(main)/(tabs)/home"));
    expect(nodeApi.delete).toHaveBeenCalledWith("/users/me");
    expect(logout).toHaveBeenCalledTimes(1);
    logout.mockRestore();
  });

  it("does nothing when the user cancels", () => {
    confirm = "cancel";
    render(<DeleteAccountSection />);
    fireEvent.press(screen.getByTestId("profile-delete-account"));
    expect(nodeApi.delete).not.toHaveBeenCalled();
  });

  it("shows an error toast and keeps the session when the call fails", async () => {
    (nodeApi.delete as jest.Mock).mockRejectedValueOnce(new Error("500"));
    const logout = jest.spyOn(authService, "logout").mockResolvedValue(undefined);
    const toast = jest.spyOn(toastStore, "showToast");
    render(<DeleteAccountSection />);
    fireEvent.press(screen.getByTestId("profile-delete-account"));

    await waitFor(() => expect(toast).toHaveBeenCalledWith("deleteAccountFailed"));
    expect(logout).not.toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
    logout.mockRestore();
    toast.mockRestore();
  });
});
