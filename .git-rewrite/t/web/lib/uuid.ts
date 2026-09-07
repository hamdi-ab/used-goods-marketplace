import { z } from "zod"

// The canonical 8-4-4-4-12 hyphenated hex form this app generates and seeds.
// Note this is a strict subset of what Postgres's `uuid` type accepts (it also
// takes 32-hex-without-hyphens and brace-wrapped forms); the app only ever
// produces the canonical form, so the regex is deliberately that strict. Unlike
// zod v4's `.uuid()`, it does not enforce the RFC 9562 version/variant nibbles,
// so it accepts the seeded demo ids (e.g. 10000000-0000-0000-0000-...) that the
// database and RLS happily store.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id)
}

/** A zod schema matching the canonical UUID form (see UUID_RE). */
export const uuidSchema = z.string().regex(UUID_RE, "Invalid UUID")