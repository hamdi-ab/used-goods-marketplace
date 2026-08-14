import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import {
  createListing,
  softDeleteListing,
  updateListing,
} from "@/lib/listings"
import type { ListingEditPayload, ListingPayload } from "@/lib/listings"

const mockCreateClient = vi.mocked(createClient)

// Minimal fluent builder: every chained method returns the builder, and the
// builder itself is a thenable that resolves to the stubbed result, so
// `await supabase.from(...)...select(...)` collapses to the canned row(s).
const builder = (result: unknown): Record<string, unknown> => {
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    order: () => b,
    maybeSingle: () => b,
    single: () => b,
    insert: () => b,
    update: () => b,
    delete: () => b,
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  return b
}

const db = (from: (table: string) => unknown) => ({ from } as never)

const editPayload = (): ListingEditPayload => ({
  id: "listing-1",
  title: "Chair",
  price: 100,
  condition: "Fair",
  city: "Bole",
  negotiable: false,
})

const createPayload = (): ListingPayload => ({
  title: "Chair",
  price: 100,
  condition: "Fair",
  city: "Bole",
  negotiable: false,
  photos: [],
})

describe("listing write seams", () => {
  it("updateListing returns ok when the row updates", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => builder({ data: [{ id: "listing-1" }], error: null }))
    )
    expect(await updateListing(editPayload(), "seller-1")).toEqual({
      ok: true,
      error: null,
    })
  })

  it("updateListing reports a row that is not found", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => builder({ data: [], error: null }))
    )
    expect(await updateListing(editPayload(), "seller-1")).toEqual({
      ok: false,
      error: "Listing not found",
    })
  })

  it("updateListing surfaces a database error", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => builder({ data: [], error: { message: "db down" } }))
    )
    expect(await updateListing(editPayload(), "seller-1")).toEqual({
      ok: false,
      error: "db down",
    })
  })

  it("softDeleteListing returns ok when the row soft-deletes", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => builder({ data: [{ id: "listing-1" }], error: null }))
    )
    expect(await softDeleteListing("listing-1", "seller-1")).toEqual({
      ok: true,
      error: null,
    })
  })

  it("softDeleteListing reports a row that is not found", async () => {
    mockCreateClient.mockResolvedValue(
      db(() => builder({ data: [], error: null }))
    )
    expect(await softDeleteListing("listing-1", "seller-1")).toEqual({
      ok: false,
      error: "Listing not found",
    })
  })

  it("createListing rejects an unknown category without touching storage", async () => {
    mockCreateClient.mockResolvedValue(
      db((table) =>
        builder(
          table === "categories"
            ? { count: 0 }
            : { data: [], error: null }
        )
      )
    )
    expect(
      await createListing({ ...createPayload(), categoryId: "nope" }, "seller-1")
    ).toEqual({ error: "Invalid category" })
  })
})
