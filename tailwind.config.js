const { hairlineWidth } = require("nativewind/theme");

/**
 * unifind brand tokens (from unifind/frontend/tailwind.config.js):
 *   prussian #023055 · turquoise #44DED1 · barc #F29049 · lightGreen #D9F8F5
 * Semantic tokens are driven by CSS variables in src/styles/global.css so
 * light/dark mode work automatically.
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // brand
        prussian: "#023055",
        turquoise: "#44DED1",
        barc: "#F29049",
        lightgreen: "#D9F8F5",
        // semantic (CSS vars → light/dark)
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
      },
      borderWidth: {
        hairline: hairlineWidth(),
      },
    },
  },
  plugins: [],
};
