import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

// unstable_cache requires Next.js's incremental cache, which isn't available
// in Vitest — stub it to call the fn and return its result unchanged.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}))

const redirectMock = vi.fn()

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    redirectMock(url)
    throw new Error(`NEXT_REDIRECT:${url}`)
  },
}))

import { createClient } from "@/lib/supabase/server"
import { requireSeller, requireTrader, requireAdmin } from "@/lib/auth"

const mockCreateClient = vi.mocked(createClient)

function mockProfile(role: "buyer" | "seller" | "admin") {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: async () => ({
        data: { user: { id: "u-1", email: "a@b.c" } },
        error: null,
      }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { full_name: null, role, profile_completion: 100 },
            error: null,
          }),
        }),
      }),
    }),
  } as never)
}

beforeEach(() => {
  redirectMock.mockReset()
})

describe("auth.requireSeller (ADR-020: admin is not a seller)", () => {
  it("admits a seller", async () => {
    mockProfile("seller")
    const user = await requireSeller()
    expect(user.role).toBe("seller")
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("redirects an admin to the console", async () => {
    mockProfile("admin")
    await expect(requireSeller()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectMock).toHaveBeenCalledWith("/admin")
  })

  it("redirects a buyer away", async () => {
    mockProfile("buyer")
    await expect(requireSeller()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectMock).toHaveBeenCalledWith("/profile")
  })
})

describe("auth.requireTrader (ADR-020: admin does not trade)", () => {
  it("admits a buyer", async () => {
    mockProfile("buyer")
    const user = await requireTrader()
    expect(user.role).toBe("buyer")
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("admits a seller", async () => {
    mockProfile("seller")
    const user = await requireTrader()
    expect(user.role).toBe("seller")
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("redirects an admin to the console", async () => {
    mockProfile("admin")
    await expect(requireTrader()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectMock).toHaveBeenCalledWith("/admin")
  })
})

describe("auth.requireAdmin (unchanged)", () => {
  it("admits an admin", async () => {
    mockProfile("admin")
    const user = await requireAdmin()
    expect(user.role).toBe("admin")
    expect(redirectMock).not.toHaveBeenCalled()
  })

  it("redirects a buyer to the dashboard", async () => {
    mockProfile("buyer")
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT")
    expect(redirectMock).toHaveBeenCalledWith("/dashboard")
  })
})
