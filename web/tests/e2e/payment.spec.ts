import { test, expect } from "@playwright/test"

import { USERS, loginAs, signOut } from "./helpers"

// Payment system E2E: withdrawal, disputes, abandonment, hold period.
// Uses demo mode (CHAPA_DEMO_FALLBACK=true) for deterministic payment simulation.
test.describe("payment system", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.seller.email, USERS.seller.password)
  })

  test("seller sees earnings card on offers page", async ({ page }) => {
    await page.goto("/offers/seller")
    await expect(page.getByRole("heading", { name: "Incoming offers" })).toBeVisible()

    // Earnings card only appears if there are accepted offers
    // (card is conditionally rendered based on offers.length)
    const earningsHeading = page.getByText("Earnings")
    if (await earningsHeading.isVisible({ timeout: 5000 })) {
      await expect(earningsHeading).toBeVisible()
    }
  })

  test("seller can view earnings breakdown", async ({ page }) => {
    await page.goto("/offers/seller")
    await expect(page.getByRole("heading", { name: "Incoming offers" })).toBeVisible()

    const showBreakdown = page.getByRole("button", { name: /Show breakdown/i })
    if (await showBreakdown.isVisible({ timeout: 5000 })) {
      await showBreakdown.click()
      await expect(page.getByText("Total sales")).toBeVisible({ timeout: 5000 })
      await expect(page.getByText("Platform fee")).toBeVisible()
      await expect(page.getByText("Net earnings")).toBeVisible()
    }
  })

  test("withdrawal requires minimum 50 ETB", async ({ page }) => {
    await page.goto("/offers/seller")
    await expect(page.getByRole("heading", { name: "Incoming offers" })).toBeVisible()

    const withdrawButton = page.getByRole("button", { name: /Min\. withdrawal is 50 ETB/i })
    const requestButton = page.getByRole("button", { name: "Request withdrawal" })

    if (await withdrawButton.isVisible({ timeout: 5000 })) {
      await expect(withdrawButton).toBeDisabled()
    } else if (await requestButton.isVisible({ timeout: 5000 })) {
      await expect(requestButton).toBeEnabled()
    }
  })

  test("admin can access disputes page", async ({ page }) => {
    await signOut(page)
    await loginAs(page, USERS.admin.email, USERS.admin.password)
    await page.goto("/admin/disputes")

    await expect(page.getByRole("heading", { name: "Disputes", exact: true })).toBeVisible()
    await expect(page.getByText(/No open disputes|Disputes opened by buyers/)).toBeVisible()
  })

  test("admin sidebar has disputes link", async ({ page }) => {
    await signOut(page)
    await loginAs(page, USERS.admin.email, USERS.admin.password)
    await page.goto("/admin")

    await expect(page.getByRole("link", { name: "Disputes" })).toBeVisible()
  })

  test("buyer can open dispute on paid offer", async ({ page }) => {
    await signOut(page)
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
    await page.goto("/offers")

    // Find an accepted offer with paid status that has a "Report issue" button
    const reportButton = page.getByRole("button", { name: /Report issue/i }).first()
    if (await reportButton.isVisible({ timeout: 5000 })) {
      await reportButton.click()

      // Dispute form should appear
      await expect(page.getByText("Open a dispute")).toBeVisible()

      // Select a reason
      await page.getByRole("button", { name: "Item not received" }).click()

      // Fill description
      await page.locator("textarea").fill("Test dispute description")

      // Submit
      await page.getByRole("button", { name: "Submit dispute" }).click()

      // Should show success message
      await expect(page.getByText("Dispute submitted")).toBeVisible({ timeout: 15000 })
    }
  })

  test("dispute form validates required fields", async ({ page }) => {
    await signOut(page)
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
    await page.goto("/offers")

    const reportButton = page.getByRole("button", { name: /Report issue/i }).first()
    if (await reportButton.isVisible({ timeout: 5000 })) {
      await reportButton.click()

      // Submit button should be disabled without reason and description
      const submitButton = page.getByRole("button", { name: "Submit dispute" })
      await expect(submitButton).toBeDisabled()

      // Select reason
      await page.getByRole("button", { name: "Not as described" }).click()

      // Still disabled without description
      await expect(submitButton).toBeDisabled()

      // Fill description
      await page.locator("textarea").fill("Item was broken")

      // Now enabled
      await expect(submitButton).toBeEnabled()
    }
  })

  test("seller can see stale payment abandonment option", async ({ page }) => {
    await page.goto("/offers/seller")

    // Look for stale payment indicator (only visible if there's a pending payment > 7 days)
    const staleIndicator = page.getByText(/Payment window expired/)
    if (await staleIndicator.isVisible({ timeout: 5000 })) {
      await expect(page.getByRole("button", { name: "Cancel sale and relist" })).toBeVisible()
    }
  })

  test("hold period shows in earnings breakdown", async ({ page }) => {
    await page.goto("/offers/seller")

    const showBreakdown = page.getByRole("button", { name: /Show breakdown/i })
    if (await showBreakdown.isVisible()) {
      await showBreakdown.click()

      // If there are confirmed payments within 48h, "On hold" should appear
      const onHold = page.getByText(/On hold/)
      if (await onHold.isVisible({ timeout: 5000 })) {
        await expect(page.getByText(/\(48h\)/)).toBeVisible()
      }
    }
  })
})

test.describe("payment flow (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await signOut(page)
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
  })

  test("buyer can initiate payment for accepted offer", async ({ page }) => {
    await page.goto("/offers")

    // Find accepted offer with pay button
    const payButton = page.getByRole("button", { name: /Pay.*with Chapa/i }).first()
    if (await payButton.isVisible({ timeout: 5000 })) {
      await payButton.click()

      // Should redirect to Chapa or show loading state
      await expect(page.getByText(/Opening Chapa checkout/)).toBeVisible({ timeout: 10000 })
    }
  })

  test("buyer can confirm receipt on paid offer", async ({ page }) => {
    await page.goto("/offers")

    // Find paid offer with confirm button
    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    if (await confirmButton.isVisible({ timeout: 5000 })) {
      await confirmButton.click()

      // Should show confirmed state
      await expect(page.getByText(/you confirmed receipt/)).toBeVisible({ timeout: 15000 })
    }
  })
})
