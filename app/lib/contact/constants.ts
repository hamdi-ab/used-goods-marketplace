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
