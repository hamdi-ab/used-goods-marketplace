import "server-only"

import { createClient } from "@/lib/supabase/server"

export type Supabase = Awaited<ReturnType<typeof createClient>>

// ---- Image primitives (shared by every upload adapter) ----

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

// ---- Upload seam ----
//
// One adapter = hypothetical seam; two = real. The listing gallery and the
// profile avatar are two adapters (different bucket / path / reconcile), so the
// shared skeleton below earns its seam. Each adapter supplies:
//   - validate(file):        magic-byte + size rules, with its own error wording
//   - path(file, index):     the storage object name
//   - reconcile(url, file, i): persist the URL (row insert / profile update)
//   - upsert?:               overwrite semantics (avatar overwrites, photos don't)

export interface MediaFile {
  file: File
  index: number
}

export interface UploadAdapter {
  bucket: string
  validate(file: File): Promise<string | null>
  path(file: File, index: number): string | Promise<string>
  upsert?: boolean
  reconcile(
    publicUrl: string,
    file: File,
    index: number
  ): Promise<string | null>
}

export type UploadResult =
  | { ok: true; publicUrls: string[] }
  | { ok: false; error: string }

export async function uploadObjects(
  files: MediaFile[],
  adapter: UploadAdapter,
  supabase: Supabase
): Promise<UploadResult> {
  // Validate every file before uploading any, so a bad batch never starts.
  for (const { file } of files) {
    const err = await adapter.validate(file)
    if (err) return { ok: false, error: err }
  }

  // Track objects successfully uploaded so they can be cleaned up if a later
  // step fails — otherwise a partial batch orphans storage objects.
  const uploadedPaths: string[] = []
  const cleanup = async () => {
    if (uploadedPaths.length) {
      await supabase.storage
        .from(adapter.bucket)
        .remove(uploadedPaths)
        .catch(() => {})
    }
  }

  const publicUrls: string[] = []
  try {
    for (const { file, index } of files) {
      const path = await adapter.path(file, index)

      const { error: uploadError } = await supabase.storage
        .from(adapter.bucket)
        .upload(path, file, { upsert: adapter.upsert ?? false })

      if (uploadError) {
        await cleanup()
        return { ok: false, error: uploadError.message }
      }
      uploadedPaths.push(path)

      const {
        data: { publicUrl },
      } = supabase.storage.from(adapter.bucket).getPublicUrl(path)
      publicUrls.push(publicUrl)

      const recErr = await adapter.reconcile(publicUrl, file, index)
      if (recErr) {
        await cleanup()
        return { ok: false, error: recErr }
      }
    }

    return { ok: true, publicUrls }
  } catch (error) {
    await cleanup()
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to upload",
    }
  }
}
