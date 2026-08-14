// Canonical site identity shared by the root layout's metadata (metadataBase,
// OG/Twitter defaults) and the sitemap so the deployment URL and copy are
// defined once.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://vintech-marketplace.vercel.app"

export const SITE_TITLE = "VinTech Marketplace — Buy and sell used goods"
export const SITE_DESCRIPTION =
  "VinTech Marketplace is a trusted platform for buying and selling used goods."
