import { test, expect } from "@playwright/test"

test("check /sell page for buyer", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("test@gmail.com")
  await page.getByLabel("Password", { exact: true }).fill("demo1234")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL("/", { timeout: 30_000 })

  await page.goto("/sell")
  await page.waitForTimeout(2_000)

  const heading = await page.locator("h1").first().textContent()
  const bodyText = await page.locator("body").innerText()

  console.log("H1:", heading)
  console.log("HAS 'Start selling':", bodyText.includes("Start selling"))
  console.log("HAS 'Sell an item':", bodyText.includes("Sell an item"))
  console.log("HAS 'Full name':", bodyText.includes("Full name"))
})

test("check /sell page for seller", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("Email").fill("amira.sellers@vintch.local")
  await page.getByLabel("Password", { exact: true }).fill("demo1234")
  await page.getByRole("button", { name: "Log in" }).click()
  await expect(page).toHaveURL("/", { timeout: 30_000 })

  await page.goto("/sell")
  await page.waitForTimeout(2_000)

  const heading = await page.locator("h1").first().textContent()
  const bodyText = await page.locator("body").innerText()

  console.log("H1:", heading)
  console.log("HAS 'Start selling':", bodyText.includes("Start selling"))
  console.log("HAS 'Sell an item':", bodyText.includes("Sell an item"))
  console.log("HAS 'Full name':", bodyText.includes("Full name"))
})
