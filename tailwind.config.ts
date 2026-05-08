import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:    "rgb(var(--paper-rgb) / <alpha-value>)",
        cream:    "rgb(var(--cream-rgb) / <alpha-value>)",
        ivory:    "rgb(var(--ivory-rgb) / <alpha-value>)",
        ink:      "rgb(var(--ink-rgb) / <alpha-value>)",
        ash:      "rgb(var(--ash-rgb) / <alpha-value>)",
        dust:     "rgb(var(--dust-rgb) / <alpha-value>)",
        rule:     "rgb(var(--rule-rgb) / <alpha-value>)",
        soft:     "rgb(var(--soft-rgb) / <alpha-value>)",
        vermilion:"rgb(var(--vermilion-rgb) / <alpha-value>)",
        ochre:    "rgb(var(--ochre-rgb) / <alpha-value>)",
        forest:   "rgb(var(--forest-rgb) / <alpha-value>)",
        plum:     "rgb(var(--plum-rgb) / <alpha-value>)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "ui-monospace", "monospace"]
      },
      letterSpacing: {
        tightish: "-0.01em",
        wider2:   "0.18em"
      }
    }
  },
  plugins: []
} satisfies Config;
