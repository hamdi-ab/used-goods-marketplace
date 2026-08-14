import { describe, it, expect, vi } from "vitest"

import { listingImageAdapter } from "@/lib/media/listing-adapter"
import { avatarAdapter } from "@/lib/media/avatar-adapter"

const makeFile = (bytes: number[], name = "photo.jpg"): File =>
  new File([new Uint8Array(bytes)], name, { type: "application/octet-stream" })

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, ...new Array(8)]
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, ...new Array(6)]
const TEXT_BYTES = [0x48, 0x65, 0x6c, 0x6c, 0x6f]

describe("media.listingImageAdapter", () => {
  it("accepts a real image (magic bytes) and rejects plain text", async () => {
    const adapter = listingImageAdapter({ listingId: "l1", supabase: {} as never })
    expect(await adapter.validate(makeFile(JPEG_BYTES))).toBeNull()
    expect(await adapter.validate(makeFile(TEXT_BYTES))).toBe(
      "photo.jpg is not a valid JPG, PNG or WebP image"
    )
  })

  it("rejects a file larger than the 5 MB cap", async () => {
    const adapter = listingImageAdapter({ listingId: "l1", supabase: {} as never })
    // A real JPEG signature with an oversized payload: passes the MIME check,
    // then trips the size cap.
    const big = new Uint8Array(5 * 1024 * 1024 + 1)
    big[0] = 0xff
    big[1] = 0xd8
    big[2] = 0xff
    expect(await adapter.validate(new File([big], "big.jpg"))).toBe(
      "Each photo must be 5 MB or smaller"
    )
  })

  it("builds a per-listing, index-suffixed storage path with the right extension", async () => {
    const adapter = listingImageAdapter({
      listingId: "listing-123",
      supabase: {} as never,
    })
    const path = await adapter.path(makeFile(JPEG_BYTES), 2)
    expect(path).toMatch(/^listing-123\/[0-9a-f-]{36}-2\.jpg$/)
  })

  it("reconciles by inserting a listing_images row", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    const supabase = { from: () => ({ insert }) } as never
    const adapter = listingImageAdapter({ listingId: "listing-123", supabase })
    expect(await adapter.reconcile("https://img/1.jpg", makeFile(JPEG_BYTES), 0)).toBeNull()
    expect(insert).toHaveBeenCalledWith({
      listing_id: "listing-123",
      image_url: "https://img/1.jpg",
      display_order: 0,
      alt_text: null,
    })
  })

  it("surfaces the insert error from reconcile", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "insert failed" } })
    const supabase = { from: () => ({ insert }) } as never
    const adapter = listingImageAdapter({ listingId: "listing-123", supabase })
    expect(await adapter.reconcile("https://img/1.jpg", makeFile(JPEG_BYTES), 0)).toBe(
      "insert failed"
    )
  })
})

describe("media.avatarAdapter", () => {
  it("accepts a real image and rejects plain text with the avatar wording", async () => {
    const adapter = avatarAdapter({ uid: "u1", supabase: {} as never })
    expect(await adapter.validate(makeFile(PNG_BYTES))).toBeNull()
    expect(await adapter.validate(makeFile(TEXT_BYTES))).toBe(
      "Upload a JPG, PNG or WebP image"
    )
  })

  it("builds an avatar path under avatars/{uid} using the client filename", async () => {
    const adapter = avatarAdapter({ uid: "user-1", supabase: {} as never })
    const path = await adapter.path(makeFile(JPEG_BYTES, "me.png"), 0)
    expect(path).toMatch(/^avatars\/user-1\/\d+\.png$/)
  })

  it("reconciles by updating the profile avatar_url for the uid", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    const supabase = { from: () => ({ update }) } as never
    const adapter = avatarAdapter({ uid: "user-1", supabase })
    expect(await adapter.reconcile("https://img/a.png", makeFile(JPEG_BYTES), 0)).toBeNull()
    expect(update).toHaveBeenCalledWith({ avatar_url: "https://img/a.png" })
    expect(eq).toHaveBeenCalledWith("id", "user-1")
  })
})
