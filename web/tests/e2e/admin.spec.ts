import { test, expect } from "@playwright/test"

import { USERS, loginAs } from "./helpers"

// Admin moderation surface. Runs only if the admin shell compiles — the
// AdminNav import was previously broken by missing lib/nav exports.
test.describe("admin", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, USERS.admin.email, USERS.admin.password)
  })

  test("overview dashboard renders", async ({ page }) => {
    await page.goto("/admin")
    await expect(page.getByRole("heading", { name: "Admin dashboard" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible()
  })

  test("users page renders suspend/restore controls", async ({ page }) => {
    await page.goto("/admin/users")
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible()
    // Seeded users exist, so at least one moderation control is present.
    await expect(page.getByRole("button", { name: /Suspend|Restore/ }).first()).toBeVisible()
  })

  test("listings page renders remove controls", async ({ page }) => {
    await page.goto("/admin/listings")
    await expect(page.getByRole("heading", { name: "Listings" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Remove" }).first()).toBeVisible()
  })

  test("reports page renders the moderation queue", async ({ page }) => {
    await page.goto("/admin/reports")
    await expect(page.getByRole("heading", { name: "Moderation queue" })).toBeVisible()
  })

  test("statistics page renders", async ({ page }) => {
    await page.goto("/admin/statistics")
    await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible()
  })

  test("verification review queue renders", async ({ page }) => {
    await page.goto("/admin/verifications")
    await expect(page.getByRole("heading", { name: "Verification review" })).toBeVisible()
  })
})

// Authz guard. Lives outside the admin describe because its beforeEach signs
// in as admin — and /login soft-redirects an already-signed-in user home.
test.describe("admin authz", () => {
  test("a buyer is redirected away from /admin", async ({ page }) => {
    await loginAs(page, USERS.buyer.email, USERS.buyer.password)
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/dashboard$/)
  })
})