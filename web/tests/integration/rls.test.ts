import { describe, expect, it } from "vitest"

import {
  anonClient,
  integrationAvailable,
  SEED,
  sellerIdsOf,
  signInAs,
} from "./helpers"

// Seed user ids are deterministic (web/supabase/seed.sql):
const AMIRA_ID = "00000000-0000-0000-0000-000000000002" // seller_phone
const FAYAD_ID = "00000000-0000-0000-0000-000000000003" // seller_fayda
const BINIAM_ID = "00000000-0000-0000-0000-000000000005" // a_buyer

// RLS matrix (docs/03-engineering/01-testing-strategy.md §8): the policies
// gate every row read/write, and the unit suite never touches them. These tests
// exercise each policy as a real role against the live stack.
describe.skipIf(!integrationAvailable)("RLS: offers", () => {
  it("anon cannot read any offers", async () => {
    // anon has no SELECT grant on offers (migrations grant to authenticated
    // only), so the gateway rejects the query outright — stronger than RLS.
    const { data, error } = await anonClient().from("offers").select("id")
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it("a buyer reads only their own offers", async () => {
    const { client, userId } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data, error } = await client.from("offers").select("buyer_id")
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(data?.every((o) => o.buyer_id === userId)).toBe(true)
  })

  it("a seller reads offers on their own listings only", async () => {
    const { client } = await signInAs(SEED.fayad.email, SEED.fayad.password)
    const { data, error } = await client
      .from("offers")
      .select("listing:listings!offers_listing_id_fkey(seller_id)")
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(sellerIdsOf(data).every((sellerId) => sellerId === FAYAD_ID)).toBe(true)
  })

  it("a seller never sees offers on another seller's listings", async () => {
    // Kebede owns none of Amira's listings, so Amira's offers must not leak.
    const { client } = await signInAs(SEED.kebede.email, SEED.kebede.password)
    const { data } = await client
      .from("offers")
      .select("listing:listings!offers_listing_id_fkey(seller_id)")
    expect(sellerIdsOf(data).every((sellerId) => sellerId !== AMIRA_ID)).toBe(true)
  })

  it("a seller sees offers on their listings from any buyer", async () => {
    const { client } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data } = await client
      .from("offers")
      .select("listing:listings!offers_listing_id_fkey(seller_id), buyer_id")
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(sellerIdsOf(data).every((sellerId) => sellerId === AMIRA_ID)).toBe(true)
    // Biniam's accepted offers sit on Amira's listings in the seed, so she
    // must see offers from a buyer who is not her.
    expect(data?.some((o) => o.buyer_id === BINIAM_ID)).toBe(true)
  })
})

describe.skipIf(!integrationAvailable)("RLS: profiles", () => {
  it("profiles are publicly readable (T03), so any user can read any row", async () => {
    const { client, userId } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: all } = await client.from("profiles").select("id")
    expect(all?.length ?? 0).toBeGreaterThan(0)
    expect(all?.some((p) => p.id === userId)).toBe(true)
    expect(all?.some((p) => p.id === AMIRA_ID)).toBe(true)
  })

  it("a user updates their own profile", async () => {
    const { client, userId } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data, error } = await client
      .from("profiles")
      .update({ city: "Addis Ababa" })
      .eq("id", userId)
      .select("id")
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(1)
  })

  it("a user cannot update another user's profile", async () => {
    const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    // RLS `using` + `with check` are owner-only; the foreign update hits 0 rows.
    const { data, error } = await client
      .from("profiles")
      .update({ city: "nope" })
      .eq("id", AMIRA_ID)
      .select("id")
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })
})

describe.skipIf(!integrationAvailable)("RLS: listings", () => {
  it("anon reads published listings", async () => {
    const { data, error } = await anonClient()
      .from("listings")
      .select("id")
      .eq("status", "published")
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBeGreaterThan(0)
  })

  it("a seller updates their own listing", async () => {
    const { client } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data: target } = await client
      .from("listings")
      .select("id")
      .eq("status", "published")
      .limit(1)
    const listingId = target?.[0]?.id
    expect(listingId).toBeDefined()

    const { data, error } = await client
      .from("listings")
      .update({ city: "Addis Ababa" })
      .eq("id", listingId)
      .select("id")
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(1)
  })

  it("a buyer cannot update a seller's listing", async () => {
    const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: target } = await anonClient()
      .from("listings")
      .select("id")
      .eq("status", "published")
      .limit(1)
    const listingId = target?.[0]?.id
    expect(listingId).toBeDefined()

    const { data, error } = await client
      .from("listings")
      .update({ city: "hacked" })
      .eq("id", listingId)
      .select("id")
    expect(error).toBeNull()
    expect(data ?? []).toHaveLength(0)
  })
})
