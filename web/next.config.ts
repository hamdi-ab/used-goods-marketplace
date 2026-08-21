import type { NextConfig } from "next";

// D6 (#25): the dev-only mock eSignet provider must never ship in a production
// build. Refuse the flag at build time, not just at the mock route's runtime 404.
if (process.env.NODE_ENV === "production" && process.env.FAYDA_MOCK === "true") {
  throw new Error("FAYDA_MOCK=true is forbidden in production builds.");
}

// T04: allow multi-photo create requests (10 x 5 MB) in a single server action.
// T15: images are served from Supabase Storage; next/image needs the host
// allowlisted so it can optimize (resize/AVIF/WebP) and lazy-load them.
function supabaseImageHost(): { protocol: "http" | "https"; hostname: string } | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return {
      protocol: parsed.protocol === "http:" ? "http" : "https",
      hostname: parsed.hostname,
    };
  } catch {
    return undefined;
  }
}

const imageHost = supabaseImageHost();

// LAN devices accessing the dev server (e.g. a phone on the same network) need
// their origin allowlisted or Next.js blocks dev chunk fetches. Set
// ALLOWED_DEV_ORIGINS in .env.local (gitignored) as a comma-separated list,
// e.g. ALLOWED_DEV_ORIGINS=192.168.1.6. localhost/127.0.0.1 are always allowed.

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ? process.env.ALLOWED_DEV_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : undefined;

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "50mb" } },
  ...(allowedDevOrigins ? { allowedDevOrigins } : {}),
  images: {
    remotePatterns: imageHost
      ? [{ protocol: imageHost.protocol, hostname: imageHost.hostname, pathname: "/**" }]
      : [],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
