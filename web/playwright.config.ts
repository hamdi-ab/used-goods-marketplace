import { defineConfig } from "@playwright/test"

// E2E smoke suite: drives a real browser against the running dev server
// (http://localhost:3000) and the live Supabase stack. It covers the client-state
// class of bugs the unit + integration suites cannot see — e.g. the sign-out
// flow where a soft navigation leaves the AuthProvider's user set.
//
// Uses the system Chrome via `channel: "chrome"` so no browser download is
// needed. The dev server must be running (or Playwright starts it and reuses
// it); the Supabase local stack must be up with seed data.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})