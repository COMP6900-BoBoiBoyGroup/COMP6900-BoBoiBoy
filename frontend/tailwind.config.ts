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
          50: "#fffcf3", // used for card backgrounds
          100: "#f7eedc", // used for the page background
          200: "#eee0c4",
        },
        ink: {
          // These are our "text and border" colours - a warm brown
          // instead of plain grey.
          200: "#e3d7c3",
          300: "#cdbda1",
          400: "#9c8a74",
          500: "#766552",
          700: "#4a3b2a",
          800: "#372b1e",
          900: "#2a2015",
        },
        brand: {
          // Green - used for the main button and the "success" state.
          50: "#eef5ea",
          100: "#d9e9cf",
          500: "#4b8f52",
          600: "#3a7641",
          700: "#2c5c32",
        },
        apple: {
          // Red - used for the apple accent colour and for error messages.
          50: "#fbeae5",
          500: "#c5533a",
          600: "#a8422c",
        },
        banana: {
          // Yellow - used for the banana accent colour and warning messages.
          50: "#fdf2d9",
          500: "#e3a52f",
          600: "#c68c1f",
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
