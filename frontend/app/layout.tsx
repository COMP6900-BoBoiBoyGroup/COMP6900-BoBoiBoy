// app/layout.tsx
//
// Root layout for the Next.js App Router. Every page is rendered inside
// this shell, so this is where we set up global <html>/<body> structure,
// page metadata (title/description shown in browser tabs & link previews),
// the display font, and import the global stylesheet.
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";

// A rounded, friendly heading font (used for titles only, via the
// --font-display CSS variable set up in tailwind.config.ts). Body text
// still uses the default system sans font for easy reading.
const displayFont = Fredoka({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

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
