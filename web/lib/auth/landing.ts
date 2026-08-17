import { isInternalPath } from "@/lib/utils"
import type { UserRole } from "./types"

// Post-login landing for an admin (ADR-020): admins are moderation-only, so
// they land on the console (/admin) and are only sent back to a ?next target
// when that target is not a trader destination. Trader destinations (/sell,
// /offers, /favorites, listing edit) fall back to /admin. /dashboard and
// /profile are read-safe: they render harmlessly and are reachable from the
// admin account menu. Buyer/seller land on their ?next target as before.
const ADMIN_TRADER_DESTINATIONS = [
  "/sell",
  "/offers",
  "/favorites",
]

function stripQuery(path: string): string {
  const q = path.search(/[?#]/)
  return q === -1 ? path : path.slice(0, q)
}

export function isAdminReadablePath(path: string): boolean {
  const clean = stripQuery(path)
  if (!isInternalPath(clean)) return false

  if (ADMIN_TRADER_DESTINATIONS.includes(clean)) return false
  if (clean.startsWith("/offers/")) return false
  if (clean.startsWith("/listings/") && clean.endsWith("/edit")) return false

  return true
}

export function resolveLoginDestination(
  role: UserRole,
  next: string | null | undefined
): string {
  if (isInternalPath(next)) {
    if (role === "admin") {
      return isAdminReadablePath(next) ? next : "/admin"
    }
    return next
  }
  return role === "admin" ? "/admin" : "/"
}
