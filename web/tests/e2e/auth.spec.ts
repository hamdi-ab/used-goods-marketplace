import { test, expect } from "@playwright/test"

const EMAIL = "amira.sellers@vintch.local"
const PASSWORD = "demo1234"

// Client-state regression: the sign-out bug shipped because a server-action
// redirect does a soft navigation and the AuthProvider's in-memory user
// survived. This test drives the real flow in a real browser and asserts the
// UI flips to logged-out WITHOUT a page reload — the exact behavior that broke.
test.describe("auth flow", () => {
  test("login and sign out round-trips through the header menu", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel("Email").fill(EMAIL)
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD)
    await page.getByRole("button", { name: "Log in" }).click()

    // Logged in: redirected home with the avatar menu present. Dev-mode first
    // compile of the home route is slow, so allow generous time for the URL.
    await expect(page).toHaveURL("/", { timeout: 30_000 })
    const avatar = page.locator('[data-slot="dropdown-menu-trigger"]')
    await expect(avatar).toBeVisible({ timeout: 30_000 })

    // Open the menu and sign out.
    await avatar.click()
    await page.getByRole("menuitem", { name: "Sign out" }).click()

    // Logged out: avatar gone, Log in link back — same page, no reload.
    await expect(avatar).toHaveCount(0)
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible()
    await expect(page).toHaveURL("/")
  })

  test("password visibility toggle flips the input type", async ({ page }) => {
    await page.goto("/login")
    const password = page.getByLabel("Password", { exact: true })
    await expect(password).toHaveAttribute("type", "password")

    await page.getByRole("button", { name: "Show password" }).click()
    await expect(password).toHaveAttribute("type", "text")

    await page.getByRole("button", { name: "Hide password" }).click()
    await expect(password).toHaveAttribute("type", "password")
  })
})