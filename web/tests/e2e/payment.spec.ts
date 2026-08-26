import { test, expect } from "@playwright/test"

import { USERS, loginAs } from "./helpers"

const BUYER_ID = "00000000-0000-0000-0000-000000000001" // admin account works as buyer for tests

async function setupAcceptedOffer() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase credentials")
  }
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  }

  // Find a published listing
  const listingsRes = await fetch(
    `${supabaseUrl}/rest/v1/listings?status=eq.published&select=id,title&limit=1`,
    { headers }
  )
  const listings = await listingsRes.json()
  if (!listings || listings.length === 0) {
    throw new Error("No published listings found")
  }
  const listingId = listings[0].id

  // Get seller_id from listing
  const listingsDetailRes = await fetch(
    `${supabaseUrl}/rest/v1/listings?id=eq.${listingId}&select=seller_id`,
    { headers }
  )
  const listingsDetail = await listingsDetailRes.json()
  const sellerId = listingsDetail[0]?.seller_id || "00000000-0000-0000-0000-000000000003"

  // Create an accepted offer for the buyer
  const offerRes = await fetch(`${supabaseUrl}/rest/v1/offers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      listing_id: listingId,
      buyer_id: BUYER_ID,
      amount: 5000,
      status: "accepted",
    }),
  })
  if (!offerRes.ok) {
    const err = await offerRes.text()
    throw new Error(`Failed to create offer: ${err}`)
  }
  const offer = (await offerRes.json())[0]

  return { offer, listingId, sellerId, supabaseUrl, headers }
}

async function createPendingPayment(offer: { id: string }, listingId: string, sellerId: string, headers: Record<string, string>, supabaseUrl: string) {
  const txRef = `demo_${Date.now()}`
  const paymentRes = await fetch(`${supabaseUrl}/rest/v1/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      offer_id: offer.id,
      listing_id: listingId,
      buyer_id: BUYER_ID,
      seller_id: sellerId,
      amount: 5000,
      currency: "ETB",
      tx_ref: txRef,
      status: "pending",
      mode: "test",
    }),
  })
  if (!paymentRes.ok) {
    const err = await paymentRes.text()
    throw new Error(`Failed to create payment: ${err}`)
  }
  return txRef
}

test.describe("chapa payment flow", () => {
  test("payment callback updates status to paid", async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)

    const { offer, listingId, sellerId, supabaseUrl, headers } = await setupAcceptedOffer()
    const txRef = await createPendingPayment(offer, listingId, sellerId, headers, supabaseUrl)

    await page.goto("/offers")
    await expect(page.getByRole("heading", { name: "My offers" })).toBeVisible()

    const payButton = page.getByRole("button", { name: /Pay.*with Chapa/ }).first()
    await expect(payButton).toBeVisible({ timeout: 15_000 })

    // Simulate Chapa callback
    const callbackUrl = `/payments/callback?tx_ref=${txRef}&offer=${offer.id}`
    await page.goto(callbackUrl)

    await page.waitForURL(/\/offers/, { timeout: 10000 })

    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    await expect(confirmButton).toBeVisible({ timeout: 15_000 })

    await confirmButton.click()

    await expect(page.getByText(/Deal closed|confirmed receipt|Paid.*you confirmed/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test("callback handles HTML-encoded ampersands (&amp;)", async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)

    const { offer, listingId, sellerId, supabaseUrl, headers } = await setupAcceptedOffer()
    const txRef = await createPendingPayment(offer, listingId, sellerId, headers, supabaseUrl)

    const callbackUrl = `/payments/callback?tx_ref=${txRef}&amp;offer=${offer.id}`
    await page.goto(callbackUrl)

    await page.waitForURL(/\/offers/, { timeout: 10000 })

    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    await expect(confirmButton).toBeVisible({ timeout: 15_000 })

    await confirmButton.click()

    await expect(page.getByText(/Deal closed|confirmed receipt|Paid.*you confirmed/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test("callback handles URL-encoded ampersands (&amp%3B)", async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)

    const { offer, listingId, sellerId, supabaseUrl, headers } = await setupAcceptedOffer()
    const txRef = await createPendingPayment(offer, listingId, sellerId, headers, supabaseUrl)

    const callbackUrl = `/payments/callback?tx_ref=${txRef}&amp%3Boffer=${offer.id}`
    await page.goto(callbackUrl)

    await page.waitForURL(/\/offers/, { timeout: 10000 })

    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    await expect(confirmButton).toBeVisible({ timeout: 15_000 })

    await confirmButton.click()

    await expect(page.getByText(/Deal closed|confirmed receipt|Paid.*you confirmed/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test("empty offers state shows browse listings", async ({ page }) => {
    await loginAs(page, USERS.seller.email, USERS.seller.password)

    await page.goto("/offers")

    await expect(page.getByText("No offers yet")).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole("link", { name: "Browse listings" })).toBeVisible()
  })

  test("paid offer shows confirm receipt button", async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)

    const { offer, listingId, sellerId, supabaseUrl, headers } = await setupAcceptedOffer()
    const txRef = await createPendingPayment(offer, listingId, sellerId, headers, supabaseUrl)

    const callbackUrl = `/payments/callback?tx_ref=${txRef}&offer=${offer.id}`
    await page.goto(callbackUrl)
    await page.waitForURL(/\/offers/, { timeout: 10000 })

    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    await expect(confirmButton).toBeVisible({ timeout: 15_000 })

    await expect(page.getByText(/Payment received/i)).toBeVisible()
  })
})
