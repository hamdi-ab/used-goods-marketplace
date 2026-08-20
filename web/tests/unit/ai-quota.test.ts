import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({})),
}))
vi.mock("@/lib/supabase/rpc", () => ({
  callRpc: vi.fn(),
}))

import { callRpc } from "@/lib/supabase/rpc"
import { consumeAiGeneration, countAiGenerationsThisMonth } from "@/lib/ai/quota"

describe("consumeAiGeneration RPC (T25)", () => {
  it("debits via record_ai_generation with the p_-prefixed param names", async () => {
    vi.mocked(callRpc).mockResolvedValue({
      data: { ok: true, error: null, used: 1, limit: 3 },
      error: null,
    })

    await consumeAiGeneration("generate", 3)

    expect(callRpc).toHaveBeenCalledWith(
      expect.anything(),
      "record_ai_generation",
      { p_event: "generate", p_limit: 3 }
    )
  })

  it("passes a null limit through for the uncapped Business tier", async () => {
    vi.mocked(callRpc).mockResolvedValue({
      data: { ok: true, error: null, used: 1, limit: null },
      error: null,
    })

    const res = await consumeAiGeneration("generate", null)

    expect(callRpc).toHaveBeenCalledWith(
      expect.anything(),
      "record_ai_generation",
      { p_event: "generate", p_limit: null }
    )
    expect(res.limit).toBeNull()
  })
})

describe("countAiGenerationsThisMonth (T25)", () => {
  it("reads used from current_ai_generation_count, defaulting to 0", async () => {
    vi.mocked(callRpc).mockResolvedValue({ data: { used: 4 }, error: null })
    await expect(countAiGenerationsThisMonth()).resolves.toBe(4)

    vi.mocked(callRpc).mockResolvedValue({ data: null, error: null })
    await expect(countAiGenerationsThisMonth()).resolves.toBe(0)
  })
})