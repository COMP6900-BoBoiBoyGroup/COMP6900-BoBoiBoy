// app/layout.tsx
//
// Root layout - Next.js wraps every page with this. Sets up the html/body
// tags, the page title shown in the browser tab, and loads the global CSS.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BoBoiBoy's Fruit Identifier",
  description:
    "Upload a photo of an apple or banana and let a CNN model identify it, then view nutrition, health, and usage information.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
