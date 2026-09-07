import {
  ALLOWED_IMAGE_MIME,
  detectImageMime,
  MAX_IMAGE_BYTES,
} from "./primitives"
import type { Supabase, UploadAdapter } from "@/lib/media"

// The profile avatar adapter: second adapter behind the shared Media upload
// seam. Same magic-byte validation surface as the listing adapter (so both
// share one security story), with overwrite semantics and a profile-row
// reconcile. Lives in the media layer; profile.ts only supplies the uid.
export function avatarAdapter(ctx: {
  uid: string
  supabase: Supabase
}): UploadAdapter {
  return {
    bucket: "profiles",
    upsert: true,
    validate: async (file) => {
      const mime = await detectImageMime(file)
      if (!mime || !ALLOWED_IMAGE_MIME.includes(mime)) {
        return "Upload a JPG, PNG or WebP image"
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return "Avatar must be 5 MB or smaller"
      }
      return null
    },
    path: (file) => {
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      return `avatars/${ctx.uid}/${Date.now()}.${ext}`
    },
    reconcile: async (publicUrl) => {
      const { error } = await ctx.supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", ctx.uid)
      return error ? error.message : null
    },
  }
}
