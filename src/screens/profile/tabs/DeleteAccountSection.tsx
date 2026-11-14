/**
 * DeleteAccountSection — in-app account deletion (issue #9).
 *
 * Apple 5.1.1(v) and Google Play require that a user can delete the account
 * from inside the app. Flow: confirm dialog → DELETE /users/me (Node API,
 * Auth0 token from the nodeApi interceptor) → local sign-out → home screen.
 * A failed call shows a toast and keeps the user signed in.
 */

import { useRef, useState } from "react";
import { router } from "expo-router";
import { Button } from "@/components/ui/button";
import { confirmAlert } from "@/components/ui/alert-dialog";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { profileApi } from "@/api/profileApi";
import { authService } from "@/services/authService";
import { showToast } from "@/stores/toastStore";

export function DeleteAccountSection() {
  const { t } = useCustomTranslation();
  const [deleting, setDeleting] = useState(false);
  // A ref, not state: two taps in the same frame both see the old state.
  const running = useRef(false);

  const deleteAccount = async () => {
    if (running.current) return;
    running.current = true;
    setDeleting(true);
    try {
      await profileApi.deleteAccount();
    } catch {
      showToast(t("deleteAccountFailed"));
      running.current = false;
      setDeleting(false);
      return;
    }
    // The account is gone: a sign-out failure must not keep the user here.
    await authService.logout().catch(() => {});
    router.replace("/(main)/(tabs)/home");
  };

  const handlePress = () => {
    confirmAlert(t("deleteAccountConfirmTitle"), t("deleteAccountConfirmMessage"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("deleteAccount"), style: "destructive", onPress: () => void deleteAccount() },
    ]);
  };

  return (
    <Button
      label={deleting ? t("common.loading") : t("deleteAccount")}
      action="destructive"
      variant="outline"
      onPress={handlePress}
      disabled={deleting}
      testID="profile-delete-account"
    />
  );
}
