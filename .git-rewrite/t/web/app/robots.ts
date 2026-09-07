import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const base = SITE_URL
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/profile", "/sell", "/offers", "/favorites", "/admin", "/onboarding"] },
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  }
}