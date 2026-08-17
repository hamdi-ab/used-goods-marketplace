// Pure type + constant surface for the auth session.
// Client-safe: this module imports no server-only APIs, so client components
// (e.g. ProfileForm) can consume ROLE_LABELS / SessionUser without pulling the
// server-only auth module graph into the browser bundle.
// Server-only helpers (getCurrentUser, requireUser) live in ../auth.

export type UserRole = "buyer" | "seller" | "admin"

export type SessionUser = {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  profileCompleted: boolean
}

export const ROLE_LABELS: Record<UserRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Admin",
}

// Single source of truth for "what role is this profile row". Guards against a
// stray DB value quietly falling through to something other than buyer.
export function normalizeRole(role: unknown): UserRole {
  return role === "admin" || role === "seller" ? role : "buyer"
}
