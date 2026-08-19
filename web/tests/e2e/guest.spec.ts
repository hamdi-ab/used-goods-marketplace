import { test, expect } from "@playwright/test"

// Guest / anonymous browsing. No session — every interactive CTA must route
// through /login?next=... instead of running a server action.
test.describe("guest", () => {
  test("home page renders hero, categories and listings", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", {
        name: /Buy and sell used goods with total confidence/,
      })
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Browse listings" })).toHaveAttribute(
      "href",
      "/search"
    )
    await expect(page.getByRole("link", { name: "Start selling" })).toBeVisible()
    await expect(page.getByRole("region", { name: "Browse by category" })).toBeVisible()
    await expect(page.locator('a[href^="/listings/"]').first()).toBeVisible()
  })

  test("search filters update the URL", async ({ page }) => {
    await page.goto("/search")
    await page.getByLabel("Search by keyword").fill("laptop")
    await page.getByRole("button", { name: "Search" }).click()
    await expect(page).toHaveURL(/\/search\?.*q=laptop/, { timeout: 15_000 })
  })

  test("listing detail renders and signed-out CTAs route to login", async ({ page }) => {
    await page.goto("/")
    const listing = page.locator('a[href^="/listings/"]').first()
    const title = await listing.getAttribute("aria-label")
    await listing.click()
    if (title) {
      await expect(page.getByRole("heading", { name: title })).toBeVisible()
    }

    const loginNext = /\/login\?next=/
    await expect(page.getByRole("link", { name: "Make an offer" })).toHaveAttribute(
      "href",
      loginNext
    )
    await expect(page.getByRole("link", { name: "Contact seller" })).toHaveAttribute(
      "href",
      loginNext
    )
    await expect(page.getByRole("link", { name: "Report listing" })).toHaveAttribute(
      "href",
      loginNext
    )
    await expect(
      page.getByRole("link", { name: "Sign in to save this listing" })
    ).toHaveAttribute("href", loginNext)

    await page.getByRole("link", { name: "Make an offer" }).click()
    await expect(page).toHaveURL(/\/login\?next=/)
  })

  test("public seller profile is reachable from a listing", async ({ page }) => {
    await page.goto("/")
    await page.locator('a[href^="/listings/"]').first().click()
    await page.getByRole("link", { name: "View seller profile" }).click()
    await expect(page).toHaveURL(/\/users\//, { timeout: 30_000 })
  })
})
