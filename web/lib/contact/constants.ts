/**
 * Pure contact domain value objects.
 *
 * Framework-agnostic constants, types and helpers shared by Server and Client
 * modules. This module intentionally has NO `server-only` import and imports no
 * Supabase client, so Client Components can consume it directly without pulling
 * the server seam into the client graph. `@/lib/contact` re-exports everything
 * here (`export *`).
 */

export const CONTACT_METHODS = ["telegram", "phone"] as const

export type ContactMethod = (typeof CONTACT_METHODS)[number]

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  telegram: "Telegram",
  phone: "Phone call",
}

// The login redirect target for the Contact Seller button. Login honors a
// `?next=` query param (see app/login/page.tsx), so a signed-out visitor who
// taps Contact lands back on the exact listing after signing in. Kept here so
// the Client Component needs no URL-building logic.
export function buildLoginUrl(pathname: string): string {
  return `/login?next=${encodeURIComponent(pathname)}`
}

// ---- Seller contact surface ----

export interface SellerContactInfo {
  telegram_username: string | null
  phone: string | null
  phone_public: boolean
}

// ---- Pure availability/URL helpers (shared by action + components) ----

/** Whether a contact method is usable for the given seller info. */
export function isContactMethodAvailable(
  info: SellerContactInfo,
  method: ContactMethod
): boolean {
  if (method === "telegram") return Boolean(info.telegram_username)
  return Boolean(info.phone && info.phone_public)
}

/** The contact methods available for a seller (0, 1, or 2). */
export function availableContactMethods(
  info: SellerContactInfo
): ContactMethod[] {
  return CONTACT_METHODS.filter((m) => isContactMethodAvailable(info, m))
}

/**
 * Build the deep-link / tel URL for a contact method. The caller is responsible
 * for checking isContactMethodAvailable first — this assumes the method's guard
 * fields are present.
 */
export function buildContactUrl(
  method: ContactMethod,
  info: SellerContactInfo
): string {
  if (method === "telegram") {
    return `https://t.me/${info.telegram_username}`
  }
  return `tel:${info.phone!.replace(/\D/g, "")}`
}
