/**
 * AppFooter — cross-platform footer component (mirrors UFContactUs web).
 *
 * Sections:
 *  1. Logo + tagline + contact info (email, location) + social links
 *  2. Nav links (Program Explorer, Growth Center, Company)
 *  3. Newsletter widget (email input + subscribe button)
 *  4. Copyright row + Terms & Conditions link
 *
 * < 300 lines; purely presentational + newsletter form state.
 * No auth required. Uses nodeApi for newsletter (public endpoint).
 */

import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Mail,
  MapPin,
  Youtube,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MessageCircle,
} from "lucide-react-native";

import { Text } from "@/components/ui/text";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Divider } from "@/components/ui/divider";
import { Logo } from "@/components/shared/Logo";
import { useCustomTranslation } from "@/hooks/useCustomTranslation";
import { useColors } from "@/hooks/useColors";
import { showToast } from "@/stores/toastStore";
import { subscribeNewsletter } from "@/api/newsletterApi";
import { useLocalization } from "@/hooks/useLocalization";

// ─── Social links (from web usePageData.ts) ──────────────────────────────────

const SOCIAL_LINKS = [
  { label: "WhatsApp",  Icon: MessageCircle, href: "https://wa.me/96176190517" },
  { label: "YouTube",   Icon: Youtube,       href: "https://www.youtube.com/@UnifindOnline" },
  { label: "Facebook",  Icon: Facebook,      href: "https://www.facebook.com/unifindonline" },
  { label: "X (Twitter)", Icon: Twitter,     href: "https://x.com/unifindonline" },
  { label: "Instagram", Icon: Instagram,     href: "https://www.instagram.com/unifindonline/" },
  { label: "LinkedIn",  Icon: Linkedin,      href: "https://www.linkedin.com/company/unifindonline" },
] as const;

// ─── Social icon button ───────────────────────────────────────────────────────

function SocialButton({
  label,
  Icon,
  href,
  iconColor,
}: {
  label: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  href: string;
  iconColor: string;
}) {
  return (
    <Pressable
      onPress={() => Linking.openURL(href)}
      accessibilityLabel={label}
      accessibilityRole="link"
      className="w-10 h-10 items-center justify-center rounded-full bg-white/10 active:opacity-70"
    >
      <Icon size={18} color={iconColor} />
    </Pressable>
  );
}

// ─── Nav section ──────────────────────────────────────────────────────────────

function NavSection({
  title,
  links,
}: {
  title: string;
  links: { label: string; onPress: () => void }[];
}) {
  return (
    <View className="gap-3">
      <Heading size="sm" className="text-secondary font-bold">
        {title}
      </Heading>
      {links.map((link) => (
        <Pressable
          key={link.label}
          onPress={link.onPress}
          accessibilityRole="button"
          hitSlop={8}
          className="py-1.5 active:opacity-70"
        >
          <Text className="text-white/85 text-sm">{link.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AppFooter() {
  const { t, isRtl } = useCustomTranslation();
  const { formatNumber } = useLocalization();
  const router = useRouter();
  const colors = useColors();

  const [email, setEmail] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async () => {
    if (!email.trim()) return;
    setSubscribing(true);
    try {
      const res = await subscribeNewsletter(email.trim());
      if (res.success) {
        showToast(t("success") + " — " + (res.message || ""));
        setEmail("");
      } else {
        showToast(t("error") + " — " + (res.message || t("error")));
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? t("error");
      showToast(msg);
    } finally {
      setSubscribing(false);
    }
  };

  // Nav sections — mirror web footer navSections
  const navSections = [
    {
      title: t("program_explorer"),
      links: [
        {
          label: t("programs"),
          onPress: () => router.push("/(main)/(tabs)/program-explorer"),
        },
        {
          label: t("institutions"),
          onPress: () => router.push("/(main)/(tabs)/program-explorer"),
        },
        {
          label: t("findPrograms"),
          onPress: () => router.push("/(main)/(tabs)/program-explorer"),
        },
      ],
    },
    {
      title: t("guideGrowthTrack"),
      links: [
        {
          label: t("offering"),
          onPress: () => router.push("/(main)/(tabs)/growth-center"),
        },
      ],
    },
    {
      title: t("company"),
      links: [
        {
          label: t("navAboutUs"),
          onPress: () => router.push("/(main)/about-us"),
        },
        {
          label: t("contact_us"),
          onPress: () => Linking.openURL("mailto:info@unifind.online"),
        },
      ],
    },
  ];

  const rowDir = isRtl ? "flex-row-reverse" : "flex-row";

  return (
    <View className="bg-primary pt-10 pb-6 px-5">
      {/* ── Logo + tagline + contact + socials ───────────────────────────── */}
      <View className="gap-4 mb-8">
        <Logo variant="white" height={32} />

        <Text className="text-white/85 text-sm leading-relaxed">
          {t("footerHelp")}
        </Text>

        {/* Contact info */}
        <View className="gap-2">
          <Pressable
            onPress={() => Linking.openURL("mailto:info@unifind.online")}
            accessibilityRole="link"
            className={`${rowDir} items-center gap-2 active:opacity-70`}
          >
            <Mail size={16} color={colors.secondary} />
            <Text className="text-white font-semibold text-sm">
              info@unifind.online
            </Text>
          </Pressable>

          <View className={`${rowDir} items-center gap-2`}>
            <MapPin size={16} color={colors.secondary} />
            <Text className="text-white/85 text-sm">
              {t("unifind_location")}
            </Text>
          </View>
        </View>

        {/* Social icons */}
        <View className={`${rowDir} gap-2 flex-wrap`}>
          {SOCIAL_LINKS.map((s) => (
            <SocialButton
              key={s.label}
              label={s.label}
              Icon={s.Icon}
              href={s.href}
              iconColor={colors.onOverlay}
            />
          ))}
        </View>
      </View>

      <Divider className="bg-white/10 mb-8" />

      {/* ── Nav sections ─────────────────────────────────────────────────── */}
      <View className="gap-8 mb-8">
        {navSections.map((section) => (
          <NavSection
            key={section.title}
            title={section.title}
            links={section.links}
          />
        ))}
      </View>

      <Divider className="bg-white/10 mb-8" />

      {/* ── Newsletter ───────────────────────────────────────────────────── */}
      <View className="gap-3 mb-8">
        <Heading size="sm" className="text-white font-bold">
          {t("subscribe")}
        </Heading>

        <Input className="bg-white/10 border-white/30">
          <InputField
            value={email}
            onChangeText={setEmail}
            placeholder={t("emailPlaceHolder")}
            placeholderTextColor={colors.onOverlay + "66"}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            className="text-white"
          />
        </Input>

        {subscribing ? (
          <View className="h-12 items-center justify-center">
            <ActivityIndicator color={colors.secondary} />
          </View>
        ) : (
          <Button
            label={t("btnSubscribe")}
            onPress={handleSubscribe}
            disabled={!email.trim()}
            action="secondary"
            className="bg-secondary"
          />
        )}
      </View>

      <Divider className="bg-white/10 mb-4" />

      {/* ── Copyright + Terms ────────────────────────────────────────────── */}
      <View className="gap-2">
        <Pressable
          onPress={() => router.push("/(main)/terms")}
          accessibilityRole="link"
          className="active:opacity-70"
        >
          <Text className="text-secondary text-sm text-center">
            {t("terms_condition")}
          </Text>
        </Pressable>

        <Text className="text-white/85 text-xs text-center">
          {t("rights", { year: formatNumber(new Date().getFullYear(), { useGrouping: false }) })}
        </Text>
      </View>
    </View>
  );
}
