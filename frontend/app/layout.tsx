// app/layout.tsx
//
// Root layout for the Next.js App Router. Every page is rendered inside
// this shell, so this is where we set up global <html>/<body> structure,
// page metadata (title/description shown in browser tabs & link previews),
// and import the global stylesheet.
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rindr - Fruit Identifier",
  description:
    "Upload a photo of an apple or banana and let a CNN model identify it, then view nutrition, health, and usage information.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
