import type { Config } from "tailwindcss";

/**
 * AURÉLLE brand design tokens.
 * Palette and typography are derived from the approved technical design
 * (.kiro/specs/luxury-womens-boutique/design.md → "Luxury Palette" & "Typography").
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        noir: "#0B0B0C",
        champagne: {
          DEFAULT: "#C5A47E",
          deep: "#A8814F",
        },
        ivory: "#F7F3EC",
        blush: "#E8D8D0",
        taupe: "#8A7F72",
        line: "#E4DDD2",
        success: "#5C7A5C",
        warn: "#C08A3E",
        danger: "#9B3D3D",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.6" }],
        sm: ["0.875rem", { lineHeight: "1.6" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.25rem", { lineHeight: "1.5" }],
        xl: ["1.5rem", { lineHeight: "1.3" }],
        "2xl": ["2rem", { lineHeight: "1.2" }],
        "3xl": ["3rem", { lineHeight: "1.15" }],
        "4xl": ["4.5rem", { lineHeight: "1.05" }],
      },
      letterSpacing: {
        eyebrow: "0.18em",
        wordmark: "0.34em",
      },
      maxWidth: {
        editorial: "76rem",
      },
      transitionTimingFunction: {
        luxe: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
