import { test, expect } from "@playwright/test"

import { USERS, firstListingTitle, loginAs } from "./helpers"

// Buyer flows: favorites, offers, reports, profile, notifications.
test.describe("buyer", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
  })

  test("favorite a listing, see it in /favorites, then remove it", async ({ page }) => {
    await page.goto("/")
    const heart = page.locator('button[aria-label="Save to favorites"]').first()
    await expect(heart).toBeVisible()
    const title = await firstListingTitle(page)
    // The toggle is a server action: wait for its POST to settle so the
    // favorite row is committed before /favorites renders (navigating away
    // mid-action races the insert).
    const actionDone = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        typeof r.request().headers()["next-action"] === "string"
    )
    await heart.click()
    await actionDone

    await page.goto("/favorites")
    await expect(page.getByRole("heading", { name: "Your favorites" })).toBeVisible()
    if (title) {
      await expect(
        page.getByRole("link", { name: title, exact: true }).first()
      ).toBeVisible()
    }

    const removeActionDone = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        typeof r.request().headers()["next-action"] === "string"
    )
    await page.locator('button[aria-label="Remove from favorites"]').first().click()
    await removeActionDone
    if (title) {
      await expect(
        page.getByRole("link", { name: title, exact: true })
      ).toHaveCount(0)
    }
  })

  test("submit an offer and see it in /offers", async ({ page }) => {
    await page.goto("/")
    const title = await firstListingTitle(page)
    await page.locator('a[href^="/listings/"]').first().click()
    await page.getByRole("button", { name: "Make an offer" }).click()

    await expect(page.getByRole("heading", { name: "Make an offer" })).toBeVisible()
    await page.locator("#offer-amount").fill("1234")
    await page.locator("#offer-message").fill("Playwright E2E offer")
    await page.getByRole("button", { name: "Send offer" }).click()
    await expect(page.getByRole("heading", { name: "Make an offer" })).toBeHidden({
      timeout: 15_000,
    })

    await page.goto("/offers")
    await expect(page.getByRole("heading", { name: "My offers" })).toBeVisible()
    if (title) {
      await expect(page.getByRole("link", { name: title }).first()).toBeVisible()
    }
  })

  test("report a listing and land on /reports", async ({ page }) => {
    await page.goto("/")
    await page.locator('a[href^="/listings/"]').first().click()
    await page.getByRole("button", { name: "Report listing" }).click()

    await expect(page.getByRole("heading", { name: "Report item" })).toBeVisible()
    await page.getByRole("radio", { name: "Spam" }).check()
    await page.locator("#report-note").fill("Playwright E2E report")
    await page.getByRole("button", { name: "Submit report" }).click()

    await expect(page.getByRole("heading", { name: "Report received" })).toBeVisible({
      timeout: 15_000,
    })
    await page.getByRole("link", { name: "View your reports" }).click()
    // /reports is cold for an authenticated user (warmup only exercises the
    // anonymous redirect), so give the first compile generous time.
    await expect(page.getByRole("heading", { name: "My reports" })).toBeVisible({
      timeout: 30_000,
    })
  })

  test("profile page renders the account form and verification card", async ({ page }) => {
    await page.goto("/profile")
    await expect(page.getByRole("heading", { name: "Your profile" })).toBeVisible()
    await expect(page.getByText("About you", { exact: true }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: "Save changes" })).toBeVisible()
    await expect(page.getByRole("link", { name: "View public profile" })).toBeVisible()
    // VerificationCard reads the T21 seam, which is stubbed to "not verified".
    await expect(page.getByText("Not verified yet").first()).toBeVisible()
  })

  test("notifications page renders", async ({ page }) => {
    await page.goto("/notifications")
    await expect(
      page.getByRole("heading", { name: "Notifications", exact: true })
    ).toBeVisible()
  })

  test("buyer dashboard shows the start-selling CTA", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByRole("heading", { name: /Welcome back/ })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Sell on the marketplace" })
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Start selling" })).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Your listings" })
    ).toHaveCount(0)
  })
})
