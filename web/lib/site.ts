// Canonical site identity shared by the root layout's metadata (metadataBase,
// OG/Twitter defaults) and the sitemap so the deployment URL and copy are
// defined once.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://vintech-marketplace.vercel.app"
    : "http://localhost:3000")

export const SITE_TITLE = "Dagim Gebeya - Buy and sell second-hand goods in Ethiopia"
export const SITE_DESCRIPTION =
  "Dagim Gebeya is a trusted platform for buying and selling second-hand goods across Ethiopia."

/** Fayda mock provider base. Uses FAYDA_ISSUER_URL if set, otherwise derives
 * from SITE_URL so the mock works in the deployed build without localhost. */
export function faydaIssuerBase(): string {
  return process.env.FAYDA_ISSUER_URL ?? `${SITE_URL}/mock-fayda`
}

/** Fayda callback URI. Uses FAYDA_REDIRECT_URI if set, otherwise derives
 * from SITE_URL. */
export function faydaRedirectUri(): string {
  return process.env.FAYDA_REDIRECT_URI ?? `${SITE_URL}/verify-fayda/callback`
}
