import { describe, it, expect } from "vitest"

import {
  fetchListing,
  fetchListings,
  fetchSellerListings,
  fetchSimilarListings,
  searchListings,
} from "@/lib/listings"

// The read fetchers accept an optional client as their last argument (the same
// injection the media and RPC seams use), so these tests drive the real
// paging/join/normalisation logic through lightweight fakes — no module mock,
// no thenable-builder hack.

const builder = (result: unknown): Record<string, unknown> => {
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    is: () => b,
    in: () => b,
    in_: () => b,
    order: () => b,
    range: () => b,
    maybeSingle: () => b,
    single: () => b,
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(result).then(resolve),
  }
  return b
}

const queue = (results: unknown[]): Record<string, unknown> => {
  let i = 0
  const b: Record<string, unknown> = {
    select: () => b,
    eq: () => b,
    is: () => b,
    in: () => b,
    in_: () => b,
    order: () => b,
    range: () => b,
    maybeSingle: () => b,
    single: () => b,
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve(results[i++] ?? { data: null, error: null }).then(resolve),
  }
  return b
}

const db = (from: (table: string) => unknown) => ({ from } as never)

const nestedRow = () => ({
  id: "listing-1",
  title: "Chair",
  price: 100,
  condition: "Fair",
  city: "Bole",
  status: "published" as const,
  published_at: "2026-01-01",
  seller: [
    {
      id: "seller-1",
      full_name: "Alem",
      avatar_url: null,
      role: "seller",
      trust_score: 50,
      phone_verified: true,
      fayda_verified: false,
    },
  ],
  images: [
    { id: "img-1", image_url: "cover.jpg", display_order: 0 },
    { id: "img-2", image_url: "second.jpg", display_order: 1 },
  ],
})

const listingRow = {
  id: "listing-1",
  title: "Chair",
  description: null,
  price: 100,
  condition: "Fair",
  category_id: null,
  seller_id: "seller-1",
  status: "published",
  city: "Bole",
  sub_city: null,
  address: null,
  negotiable: false,
  ai_assisted: false,
  published_at: "2026-01-01",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
  deleted_at: null,
}

describe("fetchListings", () => {
  it("maps nested rows and reports hasMore when more rows remain", async () => {
    const client = db(() =>
      builder({ data: [nestedRow()], error: null, count: 5 })
    )
    const result = await fetchListings({ limit: 12, offset: 0 }, client)
    expect(result.error).toBeNull()
    expect(result.listings[0].title).toBe("Chair")
    expect(result.listings[0].image_url).toBe("cover.jpg")
    expect(result.listings[0].seller?.full_name).toBe("Alem")
    expect(result.hasMore).toBe(true)
  })

  it("reports hasMore false when the window covers the count", async () => {
    const client = db(() =>
      builder({ data: [nestedRow()], error: null, count: 1 })
    )
    const result = await fetchListings({ limit: 12 }, client)
    expect(result.hasMore).toBe(false)
  })

  it("returns the error without crashing on a failed query", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db down" }, count: null })
    )
    const result = await fetchListings({}, client)
    expect(result).toMatchObject({ listings: [], hasMore: false, error: "db down" })
  })

  it("short-circuits when the category slug is unknown", async () => {
    const q = queue([
      { data: null, error: null },
      { data: [nestedRow()], error: null, count: 5 },
    ])
    const client = db(() => q)
    const result = await fetchListings({ categorySlug: "nope" }, client)
    expect(result).toMatchObject({
      listings: [],
      count: 0,
      hasMore: false,
      error: null,
    })
  })

  it("filters by a resolved category id", async () => {
    const q = queue([
      { data: { id: "cat-1" }, error: null },
      { data: [nestedRow()], error: null, count: 3 },
    ])
    const client = db(() => q)
    const result = await fetchListings({ categorySlug: "furniture" }, client)
    expect(result.listings.length).toBe(1)
    expect(result.count).toBe(3)
  })
})

describe("searchListings", () => {
  const flatRow = () => ({
    id: "listing-1",
    title: "Chair",
    price: 100,
    condition: "Fair",
    city: "Bole",
    published_at: "2026-01-01",
    image_url: "cover.jpg",
    image_count: 2,
    seller_id: "seller-1",
    seller_full_name: "Alem",
    seller_avatar_url: null,
    seller_role: "seller",
    seller_trust_score: 50,
    seller_phone_verified: true,
    seller_fayda_verified: false,
    total_count: 9,
  })

  it("maps flat RPC rows and derives hasMore from total_count", async () => {
    const client = {
      rpc: async () => ({ data: [flatRow()], error: null }),
    } as never
    const result = await searchListings({ q: "chair" }, client)
    expect(result.error).toBeNull()
    expect(result.count).toBe(9)
    expect(result.hasMore).toBe(true)
    expect(result.listings[0].image_url).toBe("cover.jpg")
    expect(result.listings[0].seller?.full_name).toBe("Alem")
  })

  it("reports hasMore false when the page covers total_count", async () => {
    const client = {
      rpc: async () => ({
        data: [{ ...flatRow(), total_count: 1 }],
        error: null,
      }),
    } as never
    const result = await searchListings({}, client)
    expect(result.hasMore).toBe(false)
  })

  it("returns an empty result when the RPC errors", async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: "boom" } }),
    } as never
    const result = await searchListings({}, client)
    expect(result).toMatchObject({
      listings: [],
      count: 0,
      hasMore: false,
      error: "boom",
    })
  })
})

describe("fetchSimilarListings (#78)", () => {
  const flatRow = () => ({
    id: "similar-1",
    title: "MacBook Air",
    price: 59000,
    condition: "Lightly Used",
    city: "Bole",
    published_at: "2026-01-01",
    image_url: "mac.jpg",
    image_count: 1,
    seller_id: "seller-1",
    seller_full_name: "Amira Sellers",
    seller_avatar_url: null,
    seller_role: "seller",
    seller_trust_score: 85,
    seller_phone_verified: true,
    seller_fayda_verified: false,
    total_count: 2,
  })

  it("maps flat RPC rows into BrowseListing rows", async () => {
    const client = {
      rpc: async () => ({ data: [flatRow()], error: null }),
    } as never
    const result = await fetchSimilarListings("20000000-0000-0000-0000-000000000007", 6, client)
    expect(result.error).toBeNull()
    expect(result.listings.length).toBe(1)
    expect(result.listings[0].title).toBe("MacBook Air")
    expect(result.listings[0].seller?.full_name).toBe("Amira Sellers")
    expect(result.listings[0].image_url).toBe("mac.jpg")
  })

  it("clamps the requested count to the 6-12 window", async () => {
    const calls: unknown[] = []
    const client = {
      async rpc(_name: string, args: { p_limit: number }) {
        calls.push(args)
        return { data: [], error: null }
      },
    } as never
    await fetchSimilarListings("src", 100, client)
    await fetchSimilarListings("src", 0, client)
    const limits = (calls as { p_limit: number }[]).map((c) => c.p_limit)
    expect(limits[0]).toBe(12)
    expect(limits[1]).toBe(1)
  })

  it("returns an empty, error-bearing result when the RPC rejects", async () => {
    const client = {
      rpc: async () => ({ data: null, error: { message: "rpc down" } }),
    } as never
    const result = await fetchSimilarListings("src", 6, client)
    expect(result).toMatchObject({ listings: [], count: 0, error: "rpc down" })
  })
})

describe("fetchSellerListings", () => {
  it("maps the cover (lowest display_order) and numeric price", async () => {
    const row = {
      ...listingRow,
      price: "100",
      images: [
        { image_url: "b.jpg", display_order: 1 },
        { image_url: "a.jpg", display_order: 0 },
      ],
    }
    const client = db(() => builder({ data: [row], error: null }))
    const result = await fetchSellerListings("seller-1", client)
    expect(result[0].price).toBe(100)
    expect(result[0].cover_image_url).toBe("a.jpg")
  })

  it("returns an empty list when the query fails", async () => {
    const client = db(() =>
      builder({ data: null, error: { message: "db down" } })
    )
    expect(await fetchSellerListings("seller-1", client)).toEqual([])
  })
})

describe("fetchListing", () => {
  it("returns null for an invalid uuid without touching the db", async () => {
    expect(await fetchListing("nope")).toBeNull()
  })

  it("skips the seller join when includeSeller is false", async () => {
    const q = queue([
      { data: listingRow, error: null },
      { data: [], error: null },
      { data: null, error: null },
    ])
    const client = db(() => q)
    const result = await fetchListing(
      "11111111-1111-1111-1111-111111111111",
      { includeSeller: false },
      client
    )
    expect(result?.listing.title).toBe("Chair")
    expect(result?.seller).toBeNull()
  })

  it("includes the seller join by default", async () => {
    const q = queue([
      { data: listingRow, error: null },
      { data: [], error: null },
      {
        data: {
          id: "seller-1",
          full_name: "Alem",
          avatar_url: null,
          role: "seller",
          trust_score: 50,
          phone_verified: true,
          fayda_verified: false,
        },
        error: null,
      },
    ])
    const client = db(() => q)
    const result = await fetchListing(
      "22222222-2222-2222-2222-222222222222",
      {},
      client
    )
    expect(result?.seller?.full_name).toBe("Alem")
  })
})