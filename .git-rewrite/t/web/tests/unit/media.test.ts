import { describe, it, expect, vi } from "vitest"

import { detectImageMime, uploadObjects } from "@/lib/media"

const makeFile = (bytes: number[], name = "photo.jpg"): File =>
  new File([new Uint8Array(bytes)], name, { type: "application/octet-stream" })

describe("media.detectImageMime", () => {
  it("detects a JPEG from magic bytes (ff d8 ff)", async () => {
    expect(
      await detectImageMime(makeFile([0xff, 0xd8, 0xff, 0xe0, ...new Array(8)]))
    ).toBe("image/jpeg")
  })

  it("detects a PNG from magic bytes (89 50 4e 47)", async () => {
    expect(
      await detectImageMime(
        makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, ...new Array(6)])
      )
    ).toBe("image/png")
  })

  it("detects a WEBP from the RIFF....WEBP signature", async () => {
    const riff = [0x52, 0x49, 0x46, 0x46, ...new Array(4), 0x57, 0x45, 0x42, 0x50]
    expect(await detectImageMime(makeFile(riff))).toBe("image/webp")
  })

  it("rejects plain text as null", async () => {
    expect(await detectImageMime(makeFile([0x48, 0x65, 0x6c, 0x6c, 0x6f]))).toBeNull()
  })

  it("rejects an empty file as null", async () => {
    expect(await detectImageMime(makeFile([]))).toBeNull()
  })
})

describe("media.uploadObjects", () => {
  it("fails fast on a validation error before touching storage", async () => {
    const adapter = {
      bucket: "listing-images",
      validate: vi.fn().mockResolvedValue("bad image"),
      path: vi.fn(),
      upsert: false,
      reconcile: vi.fn(),
    }
    const result = await uploadObjects(
      [{ file: makeFile([0x48]), index: 0 }],
      adapter,
      {} as never
    )
    expect(result).toEqual({ ok: false, error: "bad image" })
    // No storage access on a validation failure.
    expect(adapter.path).not.toHaveBeenCalled()
    expect(adapter.reconcile).not.toHaveBeenCalled()
  })
})
