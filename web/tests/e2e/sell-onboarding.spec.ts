import { test, expect } from "@playwright/test"

test("buyer sees onboarding card when selling", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("test@gmail.com")
  await page.getByLabel("Password", { exact: true }).fill("demo1234")
  await page.getByRole("button", { name: "Log in" }).click()

  await expect(page).toHaveURL("/", { timeout: 30_000 })

  await page.goto("/sell")
  await expect(page.getByText("Start selling")).toBeVisible({ timeout: 30_000 })
})

test("seller sees onboarding card when selling", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("amira.sellers@vintch.local")
  await page.getByLabel("Password", { exact: true }).fill("demo1234")
  await page.getByRole("button", { name: "Log in" }).click()

  await expect(page).toHaveURL("/", { timeout: 30_000 })

  await page.goto("/sell")
  await expect(page.getByText("Start selling")).toBeVisible({ timeout: 30_000 })
})
