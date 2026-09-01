import { test, expect } from "@playwright/test"

import { USERS, loginAs } from "./helpers"

test.describe("chapa payment flow", () => {
  test("buyer pays an accepted offer and confirms receipt", async ({ page, context }) => {
    // Login as buyer
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)

    // Go to offers page
    await page.goto("/offers")
    await expect(page.getByRole("heading", { name: "My offers" })).toBeVisible()

    // Find an accepted offer with a Pay button
    const payButton = page.getByRole("button", { name: /Pay.*with Chapa/ }).first()
    await expect(payButton).toBeVisible({ timeout: 15_000 })

    // Click pay - Chapa opens in new tab
    const [chapaPage] = await Promise.all([
      context.waitForEvent("page"),
      payButton.click(),
    ])

    // Wait for Chapa checkout to load
    await chapaPage.waitForLoadState("networkidle")

    // Fill test card details on Chapa checkout
    // Chapa's test card: 4200 0000 0000 0000, CVV 123, expiry 12/34
    const cardInput = chapaPage.locator('input[name="cardnumber"], input[placeholder*="card"], input[placeholder*="Card"]').first()
    if (await cardInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cardInput.fill("4200 0000 0000 0000")
      await chapaPage.locator('input[name="cvv"], input[placeholder*="CVV"]').first().fill("123")
      await chapaPage.locator('input[name="expiry"], input[placeholder*="expiry"]').first().fill("12/34")
      await chapaPage.getByRole("button", { name: /Pay|Confirm|Submit/ }).first().click()
    }

    // Wait for redirect back to our app (callback)
    await chapaPage.waitForURL(/\/payments\/callback/, { timeout: 30_000 })

    // Callback redirects to /offers - wait for that
    await chapaPage.waitForURL(/\/offers/, { timeout: 15_000 })

    // Go back to offers page in main tab
    await page.goto("/offers")

    // Verify "Confirm receipt" button appears (payment is paid)
    const confirmButton = page.getByRole("button", { name: "Confirm receipt" }).first()
    await expect(confirmButton).toBeVisible({ timeout: 15_000 })

    // Click confirm receipt
    await confirmButton.click()

    // Verify deal closed message
    await expect(page.getByText(/Deal closed|confirmed receipt/i).first()).toBeVisible({ timeout: 15_000 })
  })
})
