/**
 * Logo — shared UniFind brand asset component.
 *
 * Variants:
 *   "white"    — full wordmark, white on dark/prussian surfaces  (610x181)
 *   "prussian" — full wordmark, prussian on light surfaces       (241x84)
 *   "mark"     — standalone mark/icon for compact spots          (367x128)
 *
 * Aspect ratios (asset-derived):
 *   white / lightbg / darkbg  → 610:181 ≈ 3.37
 *   prussian                  → 241:84  ≈ 2.87
 *   mark                      → 367:128 ≈ 2.87
 *
 * Usage:
 *   <Logo />                         — prussian wordmark, default height 28
 *   <Logo variant="white" height={32} />
 *   <Logo variant="mark"  height={24} />
 *   <Logo variant="white" width={120} />  — explicit width, height computed
 *
 * Cross-platform: React Native Image with require() works on iOS, Android and
 * Expo web without additional config.
 */

import { Image, ImageStyle, StyleProp } from "react-native";

// ─── Asset map ────────────────────────────────────────────────────────────────

const ASSETS = {
  white: require("../../../assets/logos/unifind-logo-white.png"),
  prussian: require("../../../assets/logos/unifind-logo-prussian.png"),
  mark: require("../../../assets/logos/unifind-mark.png"),
} as const;

// Intrinsic aspect ratios (width / height) per asset.
const RATIOS: Record<keyof typeof ASSETS, number> = {
  white: 610 / 181,    // ≈ 3.37
  prussian: 241 / 84,  // ≈ 2.87
  mark: 367 / 128,     // ≈ 2.87
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LogoProps {
  /** Which logo asset to render. Default: "prussian". */
  variant?: keyof typeof ASSETS;
  /**
   * Rendered height in dp. Width is derived from the asset aspect ratio
   * unless `width` is also provided.
   * Default: 28.
   */
  height?: number;
  /**
   * Explicit rendered width in dp. When provided without height, height is
   * derived. When both are provided, both are used as-is (no forced ratio).
   */
  width?: number;
  style?: StyleProp<ImageStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Logo({
  variant = "prussian",
  height,
  width,
  style,
}: LogoProps) {
  const ratio = RATIOS[variant];

  // Resolve final dimensions — always preserve ratio unless both are explicit.
  let resolvedWidth: number;
  let resolvedHeight: number;

  if (width !== undefined && height !== undefined) {
    // Caller controls both — respect as-is.
    resolvedWidth = width;
    resolvedHeight = height;
  } else if (width !== undefined) {
    resolvedWidth = width;
    resolvedHeight = width / ratio;
  } else {
    // Default or height-only path.
    resolvedHeight = height ?? 28;
    resolvedWidth = resolvedHeight * ratio;
  }

  return (
    <Image
      source={ASSETS[variant]}
      style={[{ width: resolvedWidth, height: resolvedHeight }, style]}
      resizeMode="contain"
      accessibilityLabel="UniFind"
      accessibilityRole="image"
    />
  );
}
