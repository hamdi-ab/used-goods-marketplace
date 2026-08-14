import { describe, it, expect } from "vitest"

import { callRpc } from "@/lib/supabase/rpc"

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
