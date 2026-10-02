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
        // Simple brand palette used across buttons / highlights.
        brand: {
          50: "#f1f8f0",
          100: "#dcedd9",
          500: "#4caf50",
          600: "#3f9b43",
          700: "#2f7a33",
        },
      },
    },
  },
  plugins: [],
};

export default config;
