import { test, expect } from "@playwright/test"

import { USERS, loginAs } from "./helpers"

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64"
)

// Seller flows: dashboard, create/edit/archive listings, incoming offers,
// and the role guard that keeps buyers out of /sell.
test.describe("seller", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.seller.email, USERS.seller.password)
  })

  test("dashboard lists the seller's listings with edit and archive actions", async ({
    page,
  }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("link", { name: /Edit/ }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /Archive/ }).first()).toBeVisible()
  })

  test("create a listing and land on its detail page", async ({ page }) => {
    await page.goto("/sell")
    await page.locator('input[aria-label="upload photos"]').setInputFiles({
      name: "e2e.png",
      mimeType: "image/png",
      buffer: TINY_PNG,
    })

    const title = `E2E listing ${Date.now()}`
    await page.getByLabel("Title *").fill(title)
    await page
      .getByLabel("Description")
      .fill("A Playwright-created test listing with enough detail to publish.")
    await page.getByLabel("Price (ETB) *").fill("2500")
    await page.getByRole("radio", { name: "Brand New" }).check()
    await page.selectOption("#categoryId", { index: 1 })
    await page.getByLabel("City *").fill("Addis Ababa")
    await page.getByRole("button", { name: "Publish listing" }).click()

    await expect(page).toHaveURL(/\/listings\/[0-9a-f-]{36}$/, { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: title })).toBeVisible()
  })

  test("edit a listing from the dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: /Edit/ }).first().click()
    await expect(page).toHaveURL(/\/listings\/[0-9a-f-]{36}\/edit$/, {
      timeout: 30_000,
    })
  })

  test("incoming offers page renders", async ({ page }) => {
    await page.goto("/offers/seller")
    await expect(page.getByRole("heading", { name: "Incoming offers" })).toBeVisible()
  })

  test("own listing shows no offer/contact/report/favorite CTAs", async ({ page }) => {
    // The seller's own listing must hide every interaction CTA (INV-005).
    await page.goto("/dashboard")
    const editHref = await page
      .getByRole("link", { name: /Edit/ })
      .first()
      .getAttribute("href")
    expect(editHref).toMatch(/^\/listings\/[0-9a-f-]{36}\/edit$/)

    await page.goto(editHref!.replace(/\/edit$/, ""))
    await expect(page).toHaveURL(/\/listings\/[0-9a-f-]{36}$/)
    await expect(page.getByRole("button", { name: "Make an offer" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Contact seller" })).toHaveCount(0)
    await expect(page.getByRole("button", { name: "Report listing" })).toHaveCount(0)
    await expect(
      page.locator('button[aria-label="Save to favorites"]')
    ).toHaveCount(0)
  })
})

// Authz guard. Lives outside the seller describe because its beforeEach signs
// in as seller — and /login soft-redirects an already-signed-in user home.
test.describe("seller authz", () => {
  test("a buyer is redirected away from /sell", async ({ page }) => {
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
    await page.goto("/sell")
    await expect(page).toHaveURL(/\/profile$/, { timeout: 30_000 })
  })
})