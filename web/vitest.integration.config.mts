/// <reference types="vitest/globals" />
import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url)).replaceAll("\\", "/")

// Integration tests hit the LIVE local Supabase stack (127.0.0.1:54321) via
// the REST/Auth APIs, so they verify real PostgREST query semantics and RLS —
// the classes the unit suite's mocked client cannot see. They are excluded
// from `npm test` (unit-only) and run via `npm run test:integration`, and skip
// cleanly when the stack is not reachable.
export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", ".next/**"],
    testTimeout: 15000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: [
      {
        find: "server-only",
        replacement: root + "/vitest/stubs/server-only.ts",
      },
      {
        find: "@/lib/supabase/server",
        replacement: root + "/vitest/stubs/supabase-server.ts",
      },
      { find: "@/", replacement: root + "/" },
    ],
  },
})