/**
 * ProfileScreen — full profile with auth gate, header, tab navigation,
 * and tab content for all 7 tabs.
 *
 * Auth gate: if not logged in, show EmptyState with User icon on bg-lightgreen + Sign In button.
 * If logged in: render gradient hero + avatar + tab bar + tab content.
 *
 * Layout: non-nested; header + tabs in a top View, tab content in a flex-1 View below.
 * Each tab manages its own scrolling internally.
 */

import { useState } from "react";
import { View } from "react-native";
import { User } from "lucide-react-native";
import { ScreenContainer } from "@/components/shared/ScreenContainer";
import { VStack } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/stores/authStore";
import { useAuthActions } from "@/auth/useAuthActions";

import { ProfileHeader } from "./profile/ProfileHeader";
import { ProfileTabBar, type ProfileTab } from "./profile/ProfileTabBar";
import { ProfileInformationTab } from "./profile/tabs/ProfileInformationTab";
import { AccountCredentialsTab } from "./profile/tabs/AccountCredentialsTab";
import { AboutMeTab } from "./profile/tabs/AboutMeTab";
import { ActivityTab } from "./profile/tabs/ActivityTab";
import { FavoritesTab } from "./profile/tabs/FavoritesTab";
import { ComparisonsTab } from "./profile/tabs/ComparisonsTab";
import { BookingsTab } from "./profile/tabs/BookingsTab";
import { useUserInfo } from "@/hooks/queries/useProfile";
import { LanguageSwitch } from "@/components/shared/LanguageSwitch";

// ─── Logged-out view ──────────────────────────────────────────────────────────

export function SignedOutProfile() {
  const { t } = useCustomTranslation();
  const colors = useColors();
  // Straight to Auth0: the SignInSheet would repeat these same two buttons.
  const { busy, signIn, createAccount } = useAuthActions();

  return (
    <View className="flex-1 items-center justify-center px-8">
      {/* User icon on bg-lightgreen circle */}
      <View
        className="rounded-full bg-lightgreen items-center justify-center mb-6"
        style={{ width: 80, height: 80 }}
      >
        <User size={40} color={colors.primary} />
      </View>

      <Heading size="md" className="text-foreground text-center mb-2">
        {t("signInRequired")}
      </Heading>
      <Text className="text-muted-foreground text-center mb-6">
        {t("signInDescription")}
      </Text>

      <VStack className="gap-3 w-full">
        <Button
          label={t("signIn")}
          action="primary"
          onPress={signIn}
          disabled={busy !== null}
          testID="profile-gate-signin"
        />
        <Button
          label={t("createAccount")}
          action="primary"
          variant="outline"
          onPress={createAccount}
          disabled={busy !== null}
          testID="profile-gate-create-account"
        />
      </VStack>
    </View>
  );
}

// ─── Logged-in view ───────────────────────────────────────────────────────────

function SignedInProfile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");
  // Header data from the shared, cached user info (React Query) — refreshes
  // automatically after Profile Information is saved.
  const { data: info } = useUserInfo();
  const firstName = info?.firstName ?? "";
  const lastName = info?.lastName ?? "";
  const role = info?.role ?? "";
  const email = info?.email ?? "";

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileInformationTab />;
      case "credentials":
        return <AccountCredentialsTab />;
      case "about":
        return <AboutMeTab />;
      case "activity":
        return <ActivityTab />;
      case "favorites":
        return <FavoritesTab />;
      case "comparisons":
        return <ComparisonsTab />;
      case "bookings":
        return <BookingsTab />;
      default:
        return null;
    }
  };

  return (
    <View className="flex-1">
      {/* Header: gradient band + avatar + name + subtitle */}
      <ProfileHeader
        firstName={firstName}
        lastName={lastName}
        role={role}
        email={email}
      />

      {/* Horizontal scrollable tab bar + sign-out outside scroll */}
      <ProfileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content area — each tab scrolls internally */}
      <View className="flex-1 mt-2">
        {renderTabContent()}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  return (
    <ScreenContainer>
      <LanguageSwitch />
      {isLoggedIn ? <SignedInProfile /> : <SignedOutProfile />}
    </ScreenContainer>
  );
}
