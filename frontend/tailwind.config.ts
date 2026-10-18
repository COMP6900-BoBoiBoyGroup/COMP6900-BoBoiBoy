// tailwind.config.ts
//
// Tailwind setup. "content" tells it which folders to scan for class
// names so the final build only ships the styles we actually use.
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
