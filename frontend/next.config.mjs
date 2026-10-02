// next.config.mjs
//
// Minimal Next.js configuration for the fruit identification frontend.
// We keep this intentionally small: the app has no custom webpack needs,
// it just needs to run as a standard Next.js app on Vercel.
//
// `output: undefined` (default) is used because Vercel's platform already
// knows how to build/deploy a standard Next.js app (serverless functions +
// static assets) - we do NOT need `output: "export"` since we rely on a
// server-side API route (app/api/predict/route.ts) to proxy requests to the
// backend model service.
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Allow <Image> to render user-uploaded photos that we turn into
    // temporary object URLs on the client (handled via plain <img> instead,
    // see components/ImageUploader.tsx) - kept here as a placeholder in case
    // remote fruit images are added later for the info cards.
    remotePatterns: [],
  },
};

export default nextConfig;
