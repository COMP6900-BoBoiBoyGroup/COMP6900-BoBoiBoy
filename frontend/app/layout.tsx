// app/layout.tsx
//
// This is the root layout for the app. Next.js wraps every page in this
// file, so this is where we set up the <html>/<body> tags, the page title
// and description shown in the browser tab, the font, and the global CSS.
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// This loads a rounded, friendly-looking font we use for headings only.
// It gets stored in a CSS variable called --font-display (set up in
// tailwind.config.ts), so body text can keep using the normal system font.
const displayFont = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// This is the tab title and description shown by the browser / search engines.
export const metadata: Metadata = {
  title: "Fruit Identifier",
  description:
    "Upload a photo of an apple or banana and let a CNN model identify it, then view nutrition, health, and usage information.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={displayFont.variable}>
      <body className="min-h-screen bg-cream-100 text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
