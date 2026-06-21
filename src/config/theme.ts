/** Pure-black shadow tint for drop shadows (must not be foreground/prussian). */
export const SHADOW_COLOR = "#000000";
/** Semi-transparent scrim for camera/avatar overlay bands. */
export const SCRIM_45 = "rgba(0,0,0,0.45)";

/** unifind brand palette (mirrors unifind/frontend/tailwind.config.js). */
export const brand = {
  prussian: "#023055",
  prussianDeep: "#012240",  // darker tint for gradient tops
  prussianDark: "#041A2E",  // near-black prussian for gradient bottoms
  turquoise: "#44DED1",
  barc: "#F29049",
  lightGreen: "#D9F8F5",
} as const;

/** Semantic color token shape. All values are hex strings. */
export interface AppColors {
  background: string;
  foreground: string;
  /** Soft text/icon color for secondary/metadata — matches `text-muted-foreground` CSS token. */
  mutedForeground: string;
  muted: string;
  border: string;
  primary: string;
  /** Text/icon color that sits ON the primary fill (e.g. active segmented tab). */
  primaryForeground: string;
  secondary: string;
  accent: string;
  destructive: string;
  /**
   * Always-white token for icons/text that sit on a dark overlay
   * (e.g. prussian hero bands, hero image overlays). Do NOT use for
   * normal text — prefer `foreground`.
   */
  onOverlay: string;
}

export const lightColors: AppColors = {
  background: "#ffffff",
  foreground: "#023055",
  mutedForeground: "#6B7785",
  muted: "#F1F3F5",
  border: "#DCE3EB",
  primary: brand.prussian,
  primaryForeground: "#ffffff",
  secondary: brand.turquoise,
  accent: brand.barc,
  destructive: "#DC2626",
  onOverlay: "#ffffff",
};

export const darkColors: AppColors = {
  background: "#0A1722",
  foreground: "#FAFAFA",
  mutedForeground: "#9AA8B5",
  muted: "#162231",
  border: "#243240",
  primary: brand.turquoise,
  primaryForeground: brand.prussian,
  secondary: "#1E4A66",
  accent: brand.barc,
  destructive: "#DC2626",
  onOverlay: "#ffffff",
};
