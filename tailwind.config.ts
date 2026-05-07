import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper:    "#f1ead8",   // warm cream — page bg
        cream:    "#f8f2e2",   // lighter cream — cards
        ivory:    "#fbf6e9",   // lightest — input fills
        ink:      "#1a1410",   // near-black warm
        ash:      "#5a5247",   // body muted
        dust:     "#9a9081",   // captions
        rule:     "#cbbf9f",   // hairlines
        soft:     "#e2d8b8",   // subtle border
        vermilion:"#c33518",   // primary accent
        ochre:    "#b88a2c",   // secondary accent
        forest:   "#2f5a3a",   // success
        plum:     "#5b2840"    // tertiary
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
