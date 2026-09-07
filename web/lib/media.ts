import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export type { SupabaseClient } from "@supabase/supabase-js"
export {
  ALLOWED_IMAGE_MIME,
  detectImageMime,
  EXT_BY_MIME,
  MAX_IMAGE_BYTES,
} from "./media/primitives"

// ---- Upload seam ----
//
// One adapter = hypothetical seam; two = real. The listing gallery and the
// profile avatar are two adapters (different bucket / path / reconcile), so the
// shared skeleton below earns its seam. Each adapter lives in this layer
// (./media/listing-adapter, ./media/avatar-adapter) and supplies:
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
  supabase: SupabaseClient
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
