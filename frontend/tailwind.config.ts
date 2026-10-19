// tailwind.config.ts
//
// This is where Tailwind is set up. The "content" list below tells
// Tailwind which folders to scan for class names, so it only keeps the
// styles we actually use in the final build.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // This is our colour palette - warm cream/brown/green tones
        // instead of the usual grey/blue colours most sites use.
        cream: {
          50: "#ffffff", // used for card backgrounds
          100: "#f6f7f9", // used for the page background
          200: "#ecedef",
        },
        ui: {
          progressHigh: "#008045", //used for the progress bar
          progressMedium: "#FFC31F",
          progressLow: "#D50021",
        },
        ink: {
          // These are our "text and border" colours - a warm brown
          // instead of plain grey.
          200: "#d9dbe0",
          300: "#c6cad1",
          400: "#8e95a3",
          500: "#5b6270",
          700: "#4c525d",
          800: "#3d414a",
          900: "#2d3138",
        },
        brand: {
          // Green - used for the main button and the "success" state.
          50: "#eaf4fb",
          100: "#cbe4f5",
          500: "#1295d8",
          600: "#1d4b6b",
          700: "#052537",
        },
        apple: {
          // Red - used for the apple accent colour and for error messages.
          50: "#fbe7e7",
          500: "#cc0000",
          600: "#8a0017",
        },
        banana: {
          // Yellow - used for the banana accent colour and warning messages.
          50: "#fbf4e6",
          500: "#d98011",
          600: "#bb4400",
        },
      },
      fontFamily: {
        // This is the heading font (set up in app/layout.tsx). Body text
        // just uses the normal system font, so this is only used for titles.
        display: ["var(--font-display)", "ui-rounded", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
