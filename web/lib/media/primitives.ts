/** Pure image rules — deliberately server-free so they run under Node unit
 * tests without the `server-only` stub and can be reused by a future
 * client-side preview validator. `@/lib/media` hosts the upload seam and
 * re-exports these, so existing server imports keep resolving. */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"]

export const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

/** Returns the image MIME derived from magic bytes, or null if it's not a real
 * image (rejects executables masquerading as images). */
export async function detectImageMime(file: File): Promise<string | null> {
  const slice = file.slice(0, 12)
  const buf = await slice.arrayBuffer()
  const b = new Uint8Array(buf)
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg"
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png"
  // RIFF....WEBP
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return "image/webp"
  }
  return null
}
