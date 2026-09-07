import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/client"
import { recordListingView } from "@/lib/listings/client-view"

const mockCreateClient = vi.mocked(createClient)

function rpcScript(result: { data?: unknown; error?: { message: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue({
      data: result.data ?? null,
      error: result.error ?? null,
    }),
  }
}

describe("recordListingView (#74)", () => {
  it("fires the record_listing_view RPC with the single listing id, batched", async () => {
    const s = rpcScript({ data: { ok: true, count: 1 } })
    mockCreateClient.mockReturnValue(s as never)

    await expect(recordListingView("listing-1")).resolves.toBeUndefined()
    expect(s.rpc).toHaveBeenCalledWith("record_listing_view", {
      p_listing_ids: ["listing-1"],
    })
  })

  it("swallows a transport error so the page never depends on the counter", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    const s = rpcScript({ error: { message: "boom" } })
    mockCreateClient.mockReturnValue(s as never)

    await expect(recordListingView("listing-1")).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalledWith("recordListingView:", "boom")
    spy.mockRestore()
  })
})
