import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
}))
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { submitUpgradeIntent } from "@/app/actions/pricing"

const mockedRequireUser = vi.mocked(requireUser)
const mockedCreateClient = vi.mocked(createClient)

const mockDb = (insertResult: { error: { message: string } | null; data?: unknown }) => {
  const insert = vi.fn().mockResolvedValue(insertResult)
  mockedCreateClient.mockResolvedValue({ from: () => ({ insert }) } as never)
  return insert
}

beforeEach(() => {
  mockedRequireUser.mockResolvedValue({
    id: "user-1",
    email: "seller@test.local",
    role: "seller",
    tier: "free",
    fullName: "Seller",
    profileCompleted: true,
  } as never)
  mockDb({ error: null })
})

describe("submitUpgradeIntent action (T27)", () => {
  it("records an intent and returns the demo success message (no billing)", async () => {
    const res = await submitUpgradeIntent({} as never, (() => {
      const f = new FormData(); f.append("email", "seller@test.local"); return f
    })())
    expect(res.ok).toBe(true)
    expect(res.message).toMatch(/notify you when billing opens/)
    expect(res.message).not.toMatch(/charged|payment|card/i)
  })

  it("falls back to the session email when none is supplied", async () => {
    const form = new FormData()
    const res = await submitUpgradeIntent({} as never, form)
    expect(res.ok).toBe(true)
  })

  it("rejects when Chapa is not configured (no demo fallback, no key)", async () => {
    const form = new FormData()
    form.append("email", "not-an-email")
    const res = await submitUpgradeIntent({} as never, form)
    expect(res.ok).toBeFalsy()
    expect(res.message).toMatch(/not set up|test transactions/i)
  })

  it("ignores a tampered tier (always records pro, no self-serve upgrade)", async () => {
    const form = new FormData()
    form.append("email", "seller@test.local")
    form.append("tier", "business")
    const res = await submitUpgradeIntent({} as never, form)
    expect(res.ok).toBe(true)
  })

  it("surfaces a DB error gracefully", async () => {
    mockDb({ error: { message: "db down" } })
    const form = new FormData()
    form.append("email", "seller@test.local")
    const res = await submitUpgradeIntent({} as never, form)
    expect(res.ok).toBeFalsy()
    expect(res.message).toMatch(/try again later/i)
  })
})
