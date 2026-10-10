// next.config.mjs
//
// This is the Next.js config file. We keep it short since this app
// doesn't need anything fancy - just a normal Next.js app that Vercel can
// build and deploy on its own.
//
// Note: we don't use `output: "export"` here (which would make a plain
// static site with no server), because app/api/predict/route.ts needs to
// run as a real server function to talk to the backend.
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // This is empty for now since the photo preview uses a plain <img>
    // tag instead of next/image (see components/ImageUploader.tsx). It's
    // left here in case we want to load fruit images from another
    // website later.
    remotePatterns: [],
  },
};

export default nextConfig;
