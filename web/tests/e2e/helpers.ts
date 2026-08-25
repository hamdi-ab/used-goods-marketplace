import { type Page, expect } from "@playwright/test"

// Seed accounts from web/supabase/seed.sql (see docs/03-engineering/15-e2e-checklist.md).
export const USERS = {
  admin: { email: "admin@vintch.local", password: "admin1234" },
  seller: { email: "amira.sellers@vintch.local", password: "demo1234" },
  sellerFayda: { email: "fayad.verified@vintch.local", password: "demo1234" },
  sellerPlain: { email: "kebede.trader@vintch.local", password: "demo1234" },
  buyer: { email: "biniam.buyer@vintch.local", password: "demo1234" },
} as const

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login")
  await page.waitForLoadState("domcontentloaded")
  await page.getByLabel("Email").fill(email, { timeout: 30_000 })
  await page.getByLabel("Password", { exact: true }).fill(password, { timeout: 30_000 })
  await page.getByRole("button", { name: "Log in" }).click()
  // Logged in when the avatar menu appears in the header. Dev-mode first
  // compile of the redirect target is slow, so allow generous time.
  await expect(page.locator('[data-slot="dropdown-menu-trigger"]')).toBeVisible({
    timeout: 30_000,
  })
  // The login form soft-redirects (router.push) to home after auth. Wait for
  // that navigation to land before returning, otherwise a test's own goto can
  // be aborted by the still-in-flight push. The authed home render is a cold
  // compile path distinct from the anonymous warmup, so allow generous time.
  await expect
    .poll(
      () => new URL(page.url()).pathname,
      { timeout: 30_000 }
    )
    .not.toBe("/login")
}

export async function signOut(page: Page) {
  await page.locator('[data-slot="dropdown-menu-trigger"]').click()
  await page.getByRole("menuitem", { name: "Sign out" }).click()
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
}

/** The first listing card's title, resolved from its link's aria-label. */
export async function firstListingTitle(page: Page): Promise<string | null> {
  const listing = page.locator('a[href^="/listings/"]').first()
  await expect(listing).toBeVisible()
  return listing.getAttribute("aria-label")
}
