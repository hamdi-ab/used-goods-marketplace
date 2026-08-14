import { describe, it, expect } from "vitest"

import { mapBrowseListing, pickCoverImage } from "@/lib/listings/browse-mapper"
import type { Condition } from "@/lib/listings/constants"

const condition: Condition = "Fair"

describe("browse-mapper.mapBrowseListing (nested browse rows)", () => {
  const nested = {
    id: "l1",
    title: "Chair",
    price: 100,
    condition,
    city: "Bole",
    published_at: "2026-01-01",
    seller: [
      {
        id: "s1",
        full_name: "Ann",
        avatar_url: null,
        role: "user",
        trust_score: 4,
      },
    ],
    images: [
      { id: "i1", listing_id: "l1", image_url: "/a.jpg", display_order: 2, alt_text: null },
      { id: "i2", listing_id: "l1", image_url: "/b.jpg", display_order: 1, alt_text: null },
    ],
  }

  it("picks the lowest display_order image as the cover", () => {
    const listing = mapBrowseListing(nested)
    expect(listing.image_url).toBe("/b.jpg")
    expect(listing.image_count).toBe(2)
    expect(listing.seller).toEqual(nested.seller[0])
  })

  it("handles a row with no seller or images", () => {
    const listing = mapBrowseListing({
      ...nested,
      seller: null,
      images: null,
    })
    expect(listing.seller).toBeNull()
    expect(listing.image_url).toBeNull()
    expect(listing.image_count).toBe(0)
  })
})

describe("browse-mapper.mapBrowseListing (search RPC rows)", () => {
  const flat = {
    id: "l1",
    title: "Chair",
    price: 100,
    condition,
    city: "Bole",
    published_at: "2026-01-01",
    image_url: "/cover.jpg",
    image_count: 3,
    seller_id: "s1",
    seller_full_name: "Ann",
    seller_avatar_url: null,
    seller_role: "user",
    seller_trust_score: 4,
  }

  it("stitches the flat seller columns into the shared display shape", () => {
    expect(mapBrowseListing(flat)).toEqual({
      id: "l1",
      title: "Chair",
      price: 100,
      condition,
      city: "Bole",
      published_at: "2026-01-01",
      image_url: "/cover.jpg",
      image_count: 3,
      seller: {
        id: "s1",
        full_name: "Ann",
        avatar_url: null,
        role: "user",
        trust_score: 4,
      },
    })
  })

  it("maps a search row with no seller", () => {
    const listing = mapBrowseListing({ ...flat, seller_id: null })
    expect(listing.seller).toBeNull()
  })
})

describe("browse-mapper.pickCoverImage", () => {
  it("returns the lowest display_order image and null when empty", () => {
    expect(
      pickCoverImage([
        { image_url: "/a.jpg", display_order: 2 },
        { image_url: "/b.jpg", display_order: 0 },
      ])
    ).toBe("/b.jpg")
    expect(pickCoverImage(null)).toBeNull()
  })
})
