import type { NextConfig } from "next";

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

// Hosts allowed to fetch dev chunks/HMR. localhost is allowed by default, but
// 127.0.0.1 and LAN device IPs are not, so they must be allowlisted or the
// page renders without hydration. Set ALLOWED_DEV_ORIGINS in .env.local
// (gitignored) as a comma-separated list, e.g. 127.0.0.1,192.168.1.6.
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
