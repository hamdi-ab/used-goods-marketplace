/// <reference types="vitest/globals" />
import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

const root = fileURLToPath(new URL(".", import.meta.url)).replaceAll("\\", "/")

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./vitest/setup.ts"],
    include: [
      "tests/unit/**/*.test.ts",
      "lib/**/__tests__/**/*.test.ts",
      "lib/**/*.test.ts",
    ],
    exclude: ["node_modules/**", "dist/**", ".next/**", "tests/**/*.spec.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["lib/**/*.{ts,tsx}", "!lib/**/*.test.ts", "!lib/**/*.spec.ts"],
    },
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
