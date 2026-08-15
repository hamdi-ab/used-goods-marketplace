import { describe, expect, it } from "vitest"

import { countIncomingOffers } from "@/lib/offers"

import {
  integrationAvailable,
  SEED,
  signInAs,
} from "./helpers"

// Query-shape regression suite: catches PostgREST semantics the mocked unit
// client can't see. The dashboard count bug shipped precisely because the unit
// test asserted the query shape the author wrote, not whether the server
// accepts it. These tests pin the broken vs fixed shapes against the real
// PostgREST so a regression (like dropping the embed) fails loudly.
describe("relationship-filter query shapes (regression)", () => {
  it.skipIf(!integrationAvailable)(
    "counts incoming offers via the embedded listing (the fixed shape)",
    async () => {
      const { client, userId } = await signInAs(SEED.amira.email, SEED.amira.password)

      const { count, error } = await client
        .from("offers")
        .select("listing:listings!offers_listing_id_fkey(id)", {
          count: "exact",
          head: true,
        })
        .eq("listing.seller_id", userId)
        .in("status", ["pending", "countered"])

      expect(error).toBeNull()
      expect(typeof count).toBe("number")
    }
  )

  it.skipIf(!integrationAvailable)(
    "rejects filtering a relationship that is not embedded (the broken shape)",
    async () => {
      const { client, userId } = await signInAs(SEED.amira.email, SEED.amira.password)

      const { error } = await client
        .from("offers")
        .select("id", { count: "exact", head: true })
        .eq("listing.seller_id", userId)

      expect(error).not.toBeNull()
    }
  )

  it.skipIf(!integrationAvailable)(
    "countIncomingOffers returns a real count for a seller",
    async () => {
      const { client, userId } = await signInAs(SEED.amira.email, SEED.amira.password)

      // Amira owns published listings (seed), so her dashboard count is a real,
      // non-erroring number. This is the exact function whose shape shipped broken.
      const count = await countIncomingOffers(userId, client)
      expect(typeof count).toBe("number")
      expect(count).toBeGreaterThanOrEqual(0)
    }
  )
})