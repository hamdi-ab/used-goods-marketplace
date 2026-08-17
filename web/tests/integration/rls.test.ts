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

  it("anon cannot read phone from profiles (#70 column grant closes the leak)", async () => {
    const { data, error } = await anonClient().from("profiles").select("phone")
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it("anon still reads the public profiles columns (browse/detail joins)", async () => {
    const { data, error } = await anonClient()
      .from("profiles")
      .select("id, full_name, city, role, trust_score, phone_verified")
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBeGreaterThan(0)
    expect(data?.some((p) => p.id === AMIRA_ID)).toBe(true)
  })

  it("profiles_public is anon-readable and exposes no phone column", async () => {
    const { data, error } = await anonClient()
      .from("profiles_public")
      .select("id, full_name, role, trust_score, phone_verified, fayda_verified")
    expect(error).toBeNull()
    expect(data?.length ?? 0).toBeGreaterThan(0)

    const { error: phoneError } = await anonClient()
      .from("profiles_public")
      .select("phone")
    expect(phoneError).not.toBeNull()
  })
})

describe.skipIf(!integrationAvailable)("RLS: ai_requests (#69)", () => {
  it("anon cannot record an AI request (no execute grant on the RPC)", async () => {
    const { data, error } = await anonClient().rpc("record_ai_request", {
      p_limit: 10,
    })
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it("a buyer cannot record an AI request (seller-only gate)", async () => {
    const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data, error } = await client.rpc("record_ai_request", { p_limit: 10 })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(false)
  })

  it("a seller can record an AI request", async () => {
    const { client } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data, error } = await client.rpc("record_ai_request", { p_limit: 10 })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(true)
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
    // Deterministic target: constrain to Amira's own published listings rather
    // than the physically-first published row, whose heap order shifts as the
    // integration suite mutates rows between runs.
    const { data: target } = await client
      .from("listings")
      .select("id")
      .eq("status", "published")
      .eq("seller_id", AMIRA_ID)
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

describe.skipIf(!integrationAvailable)("RLS: rate_usage / consume_rate_budget (#85)", () => {
  it("anon without a fingerprint is denied (no bucket to charge)", async () => {
    const { data, error } = await anonClient().rpc("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: null,
    })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(false)
  })

  it("anon with a valid fingerprint consumes from the anon bucket", async () => {
    const fp = "aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000"
    const { data, error } = await anonClient().rpc("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: fp,
    })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(true)
  })

  it("anon with a malformed fingerprint is denied", async () => {
    const { data, error } = await anonClient().rpc("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: "not-a-uuid",
    })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(false)
  })

  it("an authenticated trader consumes from the auth bucket", async () => {
    const { client } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data, error } = await client.rpc("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: null,
    })
    expect(error).toBeNull()
    expect(data?.allowed).toBe(true)
  })

  it("a bucket is exhausted once its limit is spent (p_limit is server-capped)", async () => {
    const { client } = await signInAs(SEED.fayad.email, SEED.fayad.password)
    // A caller may lower the limit (tests) but never raise it; two calls at a
    // limit of 1 must exhaust the bucket on the second call.
    const first = await client.rpc("consume_rate_budget", {
      p_limit: 1,
      p_fingerprint: null,
    })
    expect(first.data?.allowed).toBe(true)
    const second = await client.rpc("consume_rate_budget", {
      p_limit: 1,
      p_fingerprint: null,
    })
    expect(second.data?.allowed).toBe(false)
  })

  it("admins can audit rate usage; traders cannot read the table", async () => {
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { data, error } = await admin.from("rate_usage").select("id").limit(1)
    expect(error).toBeNull()
    // Earlier tests in this suite consumed budget, so at least one row exists
    // and the admin audit surface is reachable.
    expect(data?.length ?? 0).toBeGreaterThan(0)

    const { client: trader } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data: traderData } = await trader.from("rate_usage").select("id")
    expect(traderData ?? []).toHaveLength(0)
  })
})

describe.skipIf(!integrationAvailable)("RLS: promote_to_seller (#71)", () => {
  it("anon cannot call promote_to_seller (no execute grant)", async () => {
    const { data, error } = await anonClient().rpc("promote_to_seller")
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it("an admin cannot become a seller (ADR-020 moderation-only)", async () => {
    const { client } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { data, error } = await client.rpc("promote_to_seller")
    expect(error).toBeNull()
    expect(data?.ok).toBe(false)
  })

  it("a buyer promotes to seller idempotently, then the seed role is restored", async () => {
    const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)

    const first = await client.rpc("promote_to_seller")
    expect(first.error).toBeNull()
    expect(first.data?.ok).toBe(true)

    // The role actually flipped to seller.
    const { data: row } = await client
      .from("profiles")
      .select("role")
      .eq("id", BINIAM_ID)
      .single()
    expect(row?.role).toBe("seller")

    // Idempotency guard: a second promotion is a successful no-op.
    const second = await client.rpc("promote_to_seller")
    expect(second.error).toBeNull()
    expect(second.data?.ok).toBe(true)

    // Restore the seed role so later suites keep their buyer assumptions.
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { error: restoreError } = await admin
      .from("profiles")
      .update({ role: "buyer" })
      .eq("id", BINIAM_ID)
    expect(restoreError).toBeNull()
  })
})

describe.skipIf(!integrationAvailable)("RLS: admin suspend / restore (#86)", () => {
  it("suspend marks suspended_at and demotes; restore re-instates seller and clears the marker", async () => {
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)

    const suspend = await admin
      .from("profiles")
      .update({ role: "buyer", suspended_at: new Date().toISOString() })
      .eq("id", BINIAM_ID)
    expect(suspend.error).toBeNull()

    const { data: suspended } = await admin
      .from("profiles")
      .select("role, suspended_at")
      .eq("id", BINIAM_ID)
      .single()
    expect(suspended?.role).toBe("buyer")
    expect(suspended?.suspended_at).not.toBeNull()

    // Restore: the marker clears and the seller role is re-instated.
    const restore = await admin
      .from("profiles")
      .update({ role: "seller", suspended_at: null })
      .eq("id", BINIAM_ID)
    expect(restore.error).toBeNull()

    const { data: restored } = await admin
      .from("profiles")
      .select("role, suspended_at")
      .eq("id", BINIAM_ID)
      .single()
    expect(restored?.role).toBe("seller")
    expect(restored?.suspended_at).toBeNull()

    // Restore the seed role so later suites keep their buyer assumptions.
    const cleanup = await admin
      .from("profiles")
      .update({ role: "buyer" })
      .eq("id", BINIAM_ID)
    expect(cleanup.error).toBeNull()
  })
})

describe.skipIf(!integrationAvailable)("RLS: verification workflow (#73)", () => {
  it("anon cannot call request_verification (no execute grant)", async () => {
    const { data, error } = await anonClient().rpc("request_verification", {
      p_type: "phone",
    })
    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })

  it("a trader requests fayda verification, then an admin approves it", async () => {
    // biniam has no live verification row (seed), so the request path is open.
    const { client } = await signInAs(SEED.biniam.email, SEED.biniam.password)

    const requested = await client.rpc("request_verification", {
      p_type: "fayda",
    })
    expect(requested.error).toBeNull()
    expect(requested.data?.ok).toBe(true)

    // One live request per type: a duplicate is refused.
    const duplicate = await client.rpc("request_verification", {
      p_type: "fayda",
    })
    expect(duplicate.error).toBeNull()
    expect(duplicate.data?.ok).toBe(false)

    // The pending row is visible to the owner.
    const { data: own } = await client
      .from("verifications")
      .select("type, status")
      .eq("user_id", BINIAM_ID)
      .order("created_at", { ascending: false })
    expect(own?.some((v) => v.type === "fayda" && v.status === "pending")).toBe(true)

    // It is queued for the admin review surface (admins read all rows).
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { data: queued } = await admin
      .from("verifications")
      .select("user_id, type, status")
      .eq("status", "pending")
    expect(
      queued?.some(
        (v) => v.user_id === BINIAM_ID && v.type === "fayda" && v.status === "pending"
      )
    ).toBe(true)

    // A non-admin calling record_verification is refused by the admin gate.
    const { client: trader } = await signInAs(SEED.amira.email, SEED.amira.password)
    const refused = await trader.rpc("record_verification", {
      p_user_id: BINIAM_ID,
      p_type: "fayda",
      p_status: "verified",
      p_notes: null,
    })
    expect(refused.error).toBeNull()
    expect(refused.data?.ok).toBe(false)

    // The admin approves: the audit row lands verified and the flag flips.
    const approved = await admin.rpc("record_verification", {
      p_user_id: BINIAM_ID,
      p_type: "fayda",
      p_status: "verified",
      p_notes: null,
    })
    expect(approved.error).toBeNull()
    expect(approved.data?.ok).toBe(true)

    const { data: row } = await admin
      .from("profiles")
      .select("fayda_verified")
      .eq("id", BINIAM_ID)
      .single()
    expect(row?.fayda_verified).toBe(true)

    // Cleanup: a rejection rescinds the flag and soft-deletes the live row
    // (approved records are immutable in place, INV-009 — the RPC supersedes
    // them), so a later run can request the same type again. The +20/-20
    // trust deltas cancel out, keeping biniam's seed trust intact.
    const rescinded = await admin.rpc("record_verification", {
      p_user_id: BINIAM_ID,
      p_type: "fayda",
      p_status: "rejected",
      p_notes: null,
    })
    expect(rescinded.error).toBeNull()
    expect(rescinded.data?.ok).toBe(true)

    const { data: after } = await admin
      .from("profiles")
      .select("fayda_verified")
      .eq("id", BINIAM_ID)
      .single()
    expect(after?.fayda_verified).toBe(false)
  })
})

describe.skipIf(!integrationAvailable)("RLS: notifications (#72)", () => {
  it("an offer submission notifies the listing seller, never other users", async () => {
    // biniam offers on one of amira's published listings.
    const { client: buyer } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: listing } = await buyer
      .from("listings")
      .select("id")
      .eq("seller_id", AMIRA_ID)
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle()
    expect(listing?.id).toBeTruthy()
    if (!listing) throw new Error("expected an amira published listing")

    const submitted = await buyer.rpc("submit_offer", {
      p_listing_id: listing.id,
      p_amount: 120,
      p_message: "Notification test offer",
    })
    expect(submitted.error).toBeNull()
    expect(submitted.data).toMatchObject({ ok: true })

    // The seller gets an unread offer_received notification.
    const { client: seller } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data: notes } = await seller
      .from("notifications")
      .select("id, type, title, is_read")
      .eq("type", "offer_received")
      .order("created_at", { ascending: false })
      .limit(1)
    expect(notes?.[0]?.type).toBe("offer_received")
    expect(notes?.[0]?.is_read).toBe(false)
    expect(notes?.[0]?.title).toContain("New offer")

    // Another user cannot read the seller's notifications (owner-only RLS).
    const { client: other } = await signInAs(SEED.fayad.email, SEED.fayad.password)
    const { data: leak } = await other
      .from("notifications")
      .select("id")
      .eq("user_id", AMIRA_ID)
    expect(leak ?? []).toHaveLength(0)

    // The owner can mark the notification read.
    const notificationId = notes?.[0]?.id
    expect(notificationId).toBeTruthy()
    const { error: readError } = await seller
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
    expect(readError).toBeNull()
    const { data: after } = await seller
      .from("notifications")
      .select("is_read")
      .eq("id", notificationId)
      .single()
    expect(after?.is_read).toBe(true)

    // Clean up: amira declines the pending offer so the suite stays idempotent.
    const { data: offers } = await seller
      .from("offers")
      .select("id")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const { error: declineError } = await seller.rpc("decline_offer", {
      p_offer_id: offers?.[0]?.id,
    })
    expect(declineError).toBeNull()
  })

  it("accepting an offer notifies the buyer, and a review notifies the seller", async () => {
    const { client: buyer } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: listing } = await buyer
      .from("listings")
      .select("id")
      .eq("seller_id", AMIRA_ID)
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle()
    expect(listing?.id).toBeTruthy()
    if (!listing) throw new Error("expected an amira published listing")

    const submitted = await buyer.rpc("submit_offer", {
      p_listing_id: listing.id,
      p_amount: 90,
    })
    expect(submitted.error).toBeNull()
    expect(submitted.data).toMatchObject({ ok: true })

    // amira accepts the offer -> biniam is notified.
    const { client: seller } = await signInAs(SEED.amira.email, SEED.amira.password)
    const { data: offers } = await seller
      .from("offers")
      .select("id")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: false })
      .limit(1)
    const offerId = offers?.[0]?.id
    expect(offerId).toBeTruthy()

    const { error: acceptError } = await seller.rpc("accept_offer", {
      p_offer_id: offerId,
    })
    expect(acceptError).toBeNull()

    const { data: buyerNotes } = await buyer
      .from("notifications")
      .select("type")
      .eq("type", "offer_accepted")
      .order("created_at", { ascending: false })
      .limit(1)
    expect(buyerNotes?.[0]?.type).toBe("offer_accepted")

    // biniam reviews the completed sale -> amira is notified.
    const { error: reviewError } = await buyer.rpc("submit_review", {
      p_offer_id: offerId,
      p_rating: 5,
      p_comment: "Smooth deal",
    })
    expect(reviewError).toBeNull()

    const { data: sellerNotes } = await seller
      .from("notifications")
      .select("type")
      .eq("type", "review_received")
      .order("created_at", { ascending: false })
      .limit(1)
    expect(sellerNotes?.[0]?.type).toBe("review_received")

    // Clean up: restore the listing to published (the accepted offer sold it)
    // and amira's seed trust score, which the review recomputed.
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { error: restoreListing } = await admin
      .from("listings")
      .update({ status: "published", sold_to_buyer_id: null })
      .eq("id", listing.id)
    expect(restoreListing).toBeNull()
    const { error: restoreTrust } = await admin
      .from("profiles")
      .update({ trust_score: 85 })
      .eq("id", AMIRA_ID)
    expect(restoreTrust).toBeNull()
  })

  it("resolving a report notifies the reporter", async () => {
    const { client: reporter } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: listing } = await reporter
      .from("listings")
      .select("id")
      .eq("seller_id", AMIRA_ID)
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle()
    expect(listing?.id).toBeTruthy()
    if (!listing) throw new Error("expected an amira published listing")

    const { error: reportError } = await reporter.rpc("submit_report", {
      p_reason: "spam",
      p_listing_id: listing.id,
      p_seller_id: null,
      p_note: null,
    })
    expect(reportError).toBeNull()

    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { data: report } = await admin
      .from("reports")
      .select("id")
      .eq("reporter_id", BINIAM_ID)
      .eq("reported_listing_id", listing.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    expect(report?.id).toBeTruthy()
    if (!report) throw new Error("expected an open report")

    const { error: resolveError } = await admin.rpc("resolve_report", {
      p_report_id: report.id,
      p_action: "reject",
      p_admin_note: null,
    })
    expect(resolveError).toBeNull()

    const { data: reporterNotes } = await reporter
      .from("notifications")
      .select("type, title")
      .eq("type", "report_resolved")
      .order("created_at", { ascending: false })
      .limit(1)
    expect(reporterNotes?.[0]?.type).toBe("report_resolved")
  })
})

describe.skipIf(!integrationAvailable)("RLS: listing views (#74)", () => {
  it("increments view_count once per viewer and keeps the event buffer admin-only", async () => {
    // Pick one of amira's published listings and its seed view_count.
    const { client: biniam } = await signInAs(SEED.biniam.email, SEED.biniam.password)
    const { data: listing } = await biniam
      .from("listings")
      .select("id, view_count")
      .eq("seller_id", AMIRA_ID)
      .eq("status", "published")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle()
    expect(listing?.id).toBeTruthy()
    if (!listing) throw new Error("expected an amira published listing")
    const original = listing.view_count

    // biniam views -> exactly one new view.
    const viewed = await biniam.rpc("record_listing_view", {
      p_listing_ids: [listing.id],
    })
    expect(viewed.error).toBeNull()
    expect(viewed.data).toMatchObject({ ok: true, count: 1 })

    // A retry inside the dedupe window is idempotent.
    const retried = await biniam.rpc("record_listing_view", {
      p_listing_ids: [listing.id],
    })
    expect(retried.error).toBeNull()
    expect(retried.data).toMatchObject({ ok: true, count: 0 })

    const { data: afterBiniam } = await biniam
      .from("listings")
      .select("view_count")
      .eq("id", listing.id)
      .single()
    expect(afterBiniam?.view_count).toBe(original + 1)

    // A distinct viewer (anon visitor) counts as a new view.
    const anon = anonClient()
    const anonView = await anon.rpc("record_listing_view", {
      p_listing_ids: [listing.id],
    })
    expect(anonView.error).toBeNull()
    expect(anonView.data).toMatchObject({ ok: true, count: 1 })
    const { data: afterAnon } = await biniam
      .from("listings")
      .select("view_count")
      .eq("id", listing.id)
      .single()
    expect(afterAnon?.view_count).toBe(original + 2)

    // RLS: a trader sees no event rows (admins only); anon has no table grant.
    const { data: leaked } = await biniam
      .from("listing_view_events")
      .select("id")
      .eq("listing_id", listing.id)
    expect(leaked ?? []).toHaveLength(0)
    const { error: anonRead } = await anon.from("listing_view_events").select("id")
    expect(anonRead?.code).toBe("42501")

    // Clean up: drop the event rows and restore the seed view_count so the
    // suite stays idempotent (admin holds the "manageable by admins" policy).
    const { client: admin } = await signInAs(SEED.admin.email, SEED.admin.password)
    const { error: deleteError } = await admin
      .from("listing_view_events")
      .delete()
      .eq("listing_id", listing.id)
    expect(deleteError).toBeNull()
    const { error: resetError } = await admin
      .from("listings")
      .update({ view_count: original })
      .eq("id", listing.id)
    expect(resetError).toBeNull()
  })
})

describe.skipIf(!integrationAvailable)("RLS: profile completion (#82)", () => {
  it("recomputes profile_completion from populated fields on every write", async () => {
    const { client: biniam, userId } = await signInAs(
      SEED.biniam.email,
      SEED.biniam.password
    )

    // Seed biniam has city only -> 20%.
    const { data: before } = await biniam
      .from("profiles")
      .select("profile_completion")
      .eq("id", userId)
      .single()
    expect(before?.profile_completion).toBe(20)

    // Adding a phone flips it to 40% with no separate completion write.
    const { error: updateError } = await biniam
      .from("profiles")
      .update({ phone: "+251911000005" })
      .eq("id", userId)
    expect(updateError).toBeNull()
    const { data: mid } = await biniam
      .from("profiles")
      .select("profile_completion")
      .eq("id", userId)
      .single()
    expect(mid?.profile_completion).toBe(40)

    // A read-only consumer (the onboarding gate) sees the same computed value
    // without selecting the fields itself — the column is authoritative.
    const { data: gate } = await biniam
      .from("profiles")
      .select("full_name, city, profile_completion")
      .eq("id", userId)
      .single()
    expect(gate?.full_name?.trim()).toBeTruthy()
    expect(gate?.city?.trim()).toBeTruthy()
    expect(gate?.profile_completion).toBe(40)

    // Clean up: clearing the phone restores the seed completion.
    const { error: resetError } = await biniam
      .from("profiles")
      .update({ phone: null })
      .eq("id", userId)
    expect(resetError).toBeNull()
    const { data: after } = await biniam
      .from("profiles")
      .select("profile_completion")
      .eq("id", userId)
      .single()
    expect(after?.profile_completion).toBe(20)
  })
})
