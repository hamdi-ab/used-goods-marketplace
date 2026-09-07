import type { SupabaseClient } from "@supabase/supabase-js"

import { validateImageFile } from "./primitives"
import type { UploadAdapter } from "@/lib/media"

// The profile avatar adapter: second adapter behind the shared Media upload
// seam. Same magic-byte validation surface as the listing adapter (so both
// share one security story), with overwrite semantics and a profile-row
// reconcile. Lives in the media layer; profile.ts only supplies the uid.
export function avatarAdapter(ctx: {
  uid: string
  supabase: SupabaseClient
}): UploadAdapter {
  return {
    bucket: "profiles",
    upsert: true,
    validate: async (file) => {
      const error = await validateImageFile(file)
      if (error) {
        return "Upload a JPG, PNG or WebP image"
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
