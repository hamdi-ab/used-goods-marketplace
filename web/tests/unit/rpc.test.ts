import { describe, it, expect } from "vitest"

import { callOutcomeRpc, callRpc } from "@/lib/supabase/rpc"

describe("supabase.callRpc", () => {
  it("returns the typed data with no error on success", async () => {
    const supabase = {
      rpc: async () => ({ data: [{ id: "1" }], error: null }),
    } as never
    const result = await callRpc<{ id: string }[]>(supabase, "search_listings", {
      p_limit: 12,
    })
    expect(result).toEqual({ data: [{ id: "1" }], error: null })
  })

  it("reduces a PostgREST error to its message", async () => {
    const supabase = {
      rpc: async () => ({ data: null, error: { message: "boom" } }),
    } as never
    const result = await callRpc(supabase, "search_listings", {})
    expect(result).toEqual({ data: null, error: "boom" })
  })

  it("normalises a missing payload to null data", async () => {
    const supabase = {
      rpc: async () => ({ data: undefined, error: null }),
    } as never
    const result = await callRpc(supabase, "submit_review", {})
    expect(result).toEqual({ data: null, error: null })
  })
})

describe("supabase.callOutcomeRpc", () => {
  it("returns the { ok, error } envelope on success", async () => {
    const supabase = {
      rpc: async () => ({ data: { ok: true, error: null }, error: null }),
    } as never
    const result = await callOutcomeRpc(supabase, "submit_offer", {}, "test")
    expect(result).toEqual({ ok: true, error: null })
  })

  it("collapses a transport error into the envelope", async () => {
    const supabase = {
      rpc: async () => ({ data: null, error: { message: "boom" } }),
    } as never
    const result = await callOutcomeRpc(supabase, "record_contact_attempt", {}, "test")
    expect(result).toEqual({ ok: false, error: "boom" })
  })

  it("returns an empty envelope when the payload is missing", async () => {
    const supabase = {
      rpc: async () => ({ data: undefined, error: null }),
    } as never
    const result = await callOutcomeRpc(supabase, "submit_offer", {}, "test")
    expect(result).toEqual({})
  })

  it("carries RPC-specific fields through the generic envelope", async () => {
    const supabase = {
      rpc: async () => ({
        data: { ok: true, error: null, seller_id: "seller-9" },
        error: null,
      }),
    } as never
    const result = await callOutcomeRpc<{
      ok: boolean
      error: string | null
      seller_id: string | null
    }>(supabase, "submit_review", {}, "test")
    expect(result).toEqual({ ok: true, error: null, seller_id: "seller-9" })
  })
})
