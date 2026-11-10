/**
 * AccountCredentialsTab — email (read-only) + password reset.
 *
 * Reset password: POST to Auth0 change_password endpoint.
 * Success: bg-lightgreen rounded-xl with CircleCheck icon + text-foreground.
 * Error: bg-destructive/10 border border-destructive with CircleAlert + reset button stays visible.
 */

import { useState } from "react";
import { View, ScrollView } from "react-native";
import { CircleCheck, CircleAlert } from "lucide-react-native";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VStack } from "@/components/ui/box";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useUserInfo } from "@/hooks/queries/useProfile";

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN as string;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID as string;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <VStack className="gap-4 p-4">
      <Skeleton className="h-6 w-40 rounded bg-muted" />
      <VStack className="gap-1">
        <Skeleton className="h-4 w-24 rounded bg-muted" />
        <Skeleton className="h-12 rounded-xl bg-muted" />
      </VStack>
      <Skeleton className="h-12 rounded-xl bg-muted" />
    </VStack>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AccountCredentialsTab() {
  const { t } = useCustomTranslation();
  const colors = useColors();

  // Shared, cached user info (React Query) — same entry as the profile header.
  const infoQuery = useUserInfo();
  const loading = infoQuery.isPending;
  const email = infoQuery.data?.email ?? "";
  const [resetting, setResetting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleResetPassword = async () => {
    if (!email) return;

    setResetting(true);
    setStatusMessage(null);
    setHasError(false);

    try {
      const res = await fetch(
        `https://${AUTH0_DOMAIN}/dbconnections/change_password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: AUTH0_CLIENT_ID,
            email,
            connection: "Username-Password-Authentication",
          }),
        }
      );

      const text = await res.text();
      let data: { message?: string; error?: string };
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }

      if (!res.ok) {
        setHasError(true);
        setStatusMessage(data.error ?? data.message ?? t("profileCredentialsError"));
      } else {
        setHasError(false);
        setStatusMessage(data.message ?? t("profileResetEmailSent"));
      }
    } catch {
      setHasError(true);
      setStatusMessage(t("profileCredentialsError"));
    } finally {
      setResetting(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="bg-card rounded-2xl p-4 gap-4">
        <Heading size="sm" className="text-foreground">{t("accountCredentials")}</Heading>

        {/* Email — read-only */}
        <VStack className="gap-1">
          <Text className="text-sm font-semibold text-foreground">{t("profileEmail")}</Text>
          <Input>
            <InputField
              value={email}
              editable={false}
              placeholder="name@example.com"
              className="text-muted-foreground"
            />
          </Input>
        </VStack>

        {/* Status banner */}
        {statusMessage ? (
          hasError ? (
            /* Error: bg-destructive/10 border border-destructive */
            <View
              style={{
                backgroundColor: colors.destructive + "1A", // ~10% opacity
                borderWidth: 1,
                borderColor: colors.destructive,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CircleAlert size={20} color={colors.destructive} />
              <Text className="text-foreground text-sm flex-1">{statusMessage}</Text>
            </View>
          ) : (
            /* Success: bg-lightgreen with CircleCheck (colors.primary) */
            <View
              className="bg-lightgreen rounded-xl"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <CircleCheck size={20} color={colors.primary} />
              <Text className="text-foreground text-sm flex-1">{statusMessage}</Text>
            </View>
          )
        ) : null}

        {/* Reset password button — visible initially and after error, hidden only on success */}
        {(!statusMessage || hasError) && (
          <Button
            label={
              resetting
                ? t("common.loading")
                : t("profileResetPassword")
            }
            action="primary"
            onPress={handleResetPassword}
            disabled={resetting || !email}
          />
        )}
      </View>
    </ScrollView>
  );
}
