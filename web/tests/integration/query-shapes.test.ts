import { describe, expect, it } from "vitest"

import { countIncomingOffers } from "@/lib/offers"

import {
  anonClient,
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
    "countIncomingOffers matches an independent count once a pending offer exists",
    async () => {
      const amira = await signInAs(SEED.amira.email, SEED.amira.password)
      const biniam = await signInAs(SEED.biniam.email, SEED.biniam.password)

      // A published listing Amira owns, so a fresh pending offer changes her count.
      const { data: targets } = await anonClient()
        .from("listings")
        .select("id, seller_id")
        .eq("status", "published")
        .limit(20)
      const amiraListing = targets?.find((l) => l.seller_id === amira.userId)?.id
      expect(amiraListing).toBeDefined()

      // Seed has no pending offers, so the count starts at zero and the lib's
      // error-swallowing return of 0 would mask a regression. Submit a real
      // pending offer through the rate-limited RPC, then compare against an
      // independent count using the raw shape.
      const submitted = await biniam.client.rpc("submit_offer", {
        p_listing_id: amiraListing,
        p_amount: 999,
        p_message: "integration test offer",
      })
      expect(submitted.error).toBeNull()
      expect(submitted.data).toMatchObject({ ok: true })

      const { count: expected } = await amira.client
        .from("offers")
        .select("listing:listings!offers_listing_id_fkey(id)", {
          count: "exact",
          head: true,
        })
        .eq("listing.seller_id", amira.userId)
        .in("status", ["pending", "countered"])

      expect(expected ?? 0).toBeGreaterThanOrEqual(1)
      const count = await countIncomingOffers(amira.userId, amira.client)
      expect(count).toBe(expected ?? 0)

      // Clean up: Amira declines the pending offer so the suite is idempotent.
      const { data: pending } = await amira.client
        .from("offers")
        .select("id")
        .eq("listing_id", amiraListing)
        .eq("status", "pending")
        .limit(1)
      const offerId = pending?.[0]?.id
      expect(offerId).toBeDefined()
      const declined = await amira.client.rpc("decline_offer", { p_offer_id: offerId })
      expect(declined.error).toBeNull()
      expect(declined.data).toMatchObject({ ok: true })
    }
  )
})
