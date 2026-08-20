import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/auth"
import { consumeRateBudget } from "@/lib/rate-limit"

const mockedCreateClient = vi.mocked(createClient)
const mockedGetCurrentUser = vi.mocked(getCurrentUser)
let rpcMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  rpcMock = vi.fn()
  rpcMock.mockResolvedValue({ data: { allowed: true, error: null }, error: null })
  mockedCreateClient.mockResolvedValue({ rpc: rpcMock } as never)
  mockedGetCurrentUser.mockResolvedValue({
    id: "00000000-0000-0000-0000-000000000002",
    email: "amira@test.local",
    role: "seller",
    fullName: "Amira",
    profileCompleted: true,
  })
})

describe("consumeRateBudget (fix #85)", () => {
  it("allows when the shared bucket is not exhausted", async () => {
    const res = await consumeRateBudget()
    expect(res.ok).toBe(true)
    expect(res.ok ? undefined : res.message).toBeUndefined()
  })

  it("denies when the RPC marks the bucket exhausted", async () => {
    rpcMock.mockResolvedValue({
      data: { allowed: false, error: "rate limit exceeded" },
      error: null,
    })
    const res = await consumeRateBudget()
    expect(res.ok).toBe(false)
    expect(res.ok ? undefined : res.message).toMatch(/Too many requests/)
  })

  it("denies on a transport error from the RPC", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } })
    const res = await consumeRateBudget()
    expect(res.ok).toBe(false)
  })

  it("uses the auth bucket (no fingerprint) when signed in", async () => {
    await consumeRateBudget()
    expect(rpcMock).toHaveBeenCalledWith("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: null,
    })
  })

  it("uses the anon fingerprint bucket when not signed in", async () => {
    mockedGetCurrentUser.mockResolvedValue(null)
    const res = await consumeRateBudget({
      fingerprint: "aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000",
    })
    expect(res.ok).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("consume_rate_budget", {
      p_limit: null,
      p_fingerprint: "aaaaaaaa-bbbb-cccc-dddd-eeeeffff0000",
    })
  })

  it("passes a lowered limit through (tests, runtime overrides)", async () => {
    const res = await consumeRateBudget({ limit: 2 })
    expect(res.ok).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith("consume_rate_budget", {
      p_limit: 2,
      p_fingerprint: null,
    })
  })
})
