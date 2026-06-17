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
  muted: "#6B7785",
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
  muted: "#9AA8B5",
  border: "#243240",
  primary: brand.turquoise,
  primaryForeground: brand.prussian,
  secondary: "#1E4A66",
  accent: brand.barc,
  destructive: "#DC2626",
  onOverlay: "#ffffff",
};
