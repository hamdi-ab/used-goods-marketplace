import { describe, expect, it } from "vitest"

import {
  anonClient,
  integrationAvailable,
  SEED,
  signInAs,
} from "./helpers"

// Seed user ids are deterministic (web/supabase/seed.sql):
const AMIRA_ID = "00000000-0000-0000-0000-000000000002" // seller_phone
const FAYAD_ID = "00000000-0000-0000-0000-000000000003" // seller_fayda
const BINIAM_ID = "00000000-0000-0000-0000-000000000005" // a_buyer

// RLS matrix (docs/03-engineering/01-testing-strategy.md §8): the policies
// gate every row read/write, and the unit suite never touches them. These tests
// exercise each policy as a real role against the live stack.
describe("RLS: offers", () => {
  it.skipIf(!integrationAvailable)(
    "anon cannot read any offers",
    async () => {
      // anon has no SELECT grant on offers (migrations grant to authenticated
      // only), so the gateway rejects the query outright — stronger than RLS.
      const { data, error } = await anonClient().from("offers").select("id")
      expect(error).not.toBeNull()
      expect(data).toBeNull()
    }
  )

  it.skipIf(!integrationAvailable)(
    "a buyer reads only their own offers",
    async () => {
      const { client, userId } = await signInAs(SEED.biniam.email, SEED.biniam.password)
      const { data, error } = await client.from("offers").select("buyer_id")
      expect(error).toBeNull()
      expect(data?.length ?? 0).toBeGreaterThan(0)
      expect(data?.every((o) => o.buyer_id === userId)).toBe(true)
    }
  )

  it.skipIf(!integrationAvailable)(
    "a seller reads offers on their own listings only",
    async () => {
      const { client } = await signInAs(SEED.fayad.email, SEED.fayad.password)
      const { data, error } = await client
        .from("offers")
        .select("listing:listings!offers_listing_id_fkey(seller_id)")
      expect(error).toBeNull()
      expect(data?.length ?? 0).toBeGreaterThan(0)
      const sellers = data?.map((o) => (o.listing as unknown as { seller_id: string }).seller_id)
      expect(sellers?.every((sellerId) => sellerId === FAYAD_ID)).toBe(true)
    }
  )

  it.skipIf(!integrationAvailable)(
    "a seller never sees offers on another seller's listings",
    async () => {
      // Kebede owns none of Amira's listings, so Amira's offers must not leak.
      const { client } = await signInAs(SEED.kebede.email, SEED.kebede.password)
      const { data } = await client
        .from("offers")
        .select("listing:listings!offers_listing_id_fkey(seller_id)")
      const sellers = data?.map((o) => (o.listing as unknown as { seller_id: string }).seller_id)
      expect(sellers?.every((sellerId) => sellerId !== AMIRA_ID)).toBe(true)
    }
  )

  it.skipIf(!integrationAvailable)(
    "a seller sees offers on their listings from any buyer",
    async () => {
      const { client } = await signInAs(SEED.amira.email, SEED.amira.password)
      const { data } = await client
        .from("offers")
        .select("listing:listings!offers_listing_id_fkey(seller_id), buyer_id")
      expect(data?.length ?? 0).toBeGreaterThan(0)
      const sellers = data?.map((o) => (o.listing as unknown as { seller_id: string }).seller_id)
      expect(sellers?.every((sellerId) => sellerId === AMIRA_ID)).toBe(true)
      // Biniam's accepted offers sit on Amira's listings in the seed, so she
      // must see offers from a buyer who is not her.
      expect(data?.some((o) => o.buyer_id === BINIAM_ID)).toBe(true)
    }
  )
})

describe("RLS: profiles", () => {
  it.skipIf(!integrationAvailable)(
    "profiles are publicly readable (T03), so any user can read any row",
    async () => {
      const { client, userId } = await signInAs(SEED.biniam.email, SEED.biniam.password)
      const { data: all } = await client.from("profiles").select("id")
      expect(all?.length ?? 0).toBeGreaterThan(0)
      expect(all?.some((p) => p.id === userId)).toBe(true)
      expect(all?.some((p) => p.id === AMIRA_ID)).toBe(true)
    }
  )

  it.skipIf(!integrationAvailable)(
    "a user cannot update another user's profile",
    async () => {
      const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)
      // RLS `using` + `with check` are owner-only; the foreign update hits 0 rows.
      const { data, error } = await client
        .from("profiles")
        .update({ city: "nope" })
        .eq("id", AMIRA_ID)
        .select("id")
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(0)
    }
  )
})

describe("RLS: listings", () => {
  it.skipIf(!integrationAvailable)(
    "anon reads published listings",
    async () => {
      const { data, error } = await anonClient()
        .from("listings")
        .select("id")
        .eq("status", "published")
      expect(error).toBeNull()
      expect(data?.length ?? 0).toBeGreaterThan(0)
    }
  )

  it.skipIf(!integrationAvailable)(
    "a buyer cannot update a seller's listing",
    async () => {
      const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)
      const { data: target } = await anonClient()
        .from("listings")
        .select("id")
        .eq("status", "published")
        .limit(1)
      const listingId = target?.[0]?.id
      if (!listingId) return

      const { data, error } = await client
        .from("listings")
        .update({ city: "hacked" })
        .eq("id", listingId)
        .select("id")
      expect(error).toBeNull()
      expect(data ?? []).toHaveLength(0)
    }
  )
})