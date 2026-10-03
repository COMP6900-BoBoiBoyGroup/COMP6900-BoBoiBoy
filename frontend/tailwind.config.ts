// tailwind.config.ts
//
// Tailwind CSS configuration. We scan the `app` and `components` folders
// for class names so unused styles are purged from the production build.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, fruit-inspired palette (replaces the generic slate/indigo
        // "default AI app" look with something that feels intentional).
        cream: {
          50: "#fffcf3", // card backgrounds
          100: "#f7eedc", // page background
          200: "#eee0c4",
        },
        ink: {
          // Warm charcoal/brown used instead of grey "slate" tones.
          200: "#e3d7c3",
          300: "#cdbda1",
          400: "#9c8a74",
          500: "#766552",
          700: "#4a3b2a",
          800: "#372b1e",
          900: "#2a2015",
        },
        brand: {
          // Forest green - primary buttons / accents.
          50: "#eef5ea",
          100: "#d9e9cf",
          500: "#4b8f52",
          600: "#3a7641",
          700: "#2c5c32",
        },
        apple: {
          // Warm red, used for the "apple" accent and confidence states.
          50: "#fbeae5",
          500: "#c5533a",
          600: "#a8422c",
        },
        banana: {
          // Banana yellow, used as a secondary accent.
          50: "#fdf2d9",
          500: "#e3a52f",
          600: "#c68c1f",
        },
      },
      fontFamily: {
        // Rounded, friendly display font for headings; body text keeps the
        // system sans stack for easy reading.
        display: ["var(--font-display)", "ui-rounded", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
