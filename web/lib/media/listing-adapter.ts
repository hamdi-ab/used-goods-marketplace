import { randomUUID } from "node:crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

import {
  EXT_BY_MIME,
  detectImageMime,
  validateImageFile,
} from "./primitives"
import type { UploadAdapter } from "@/lib/media"

// The listing gallery adapter: bucket + path + validate + reconcile for a
// listing's photos. One of the two adapters behind the shared Media upload
// seam (the other is the profile avatar, ./avatar-adapter). Lives in the media
// layer so the listing domain never knows storage bucket names, object paths
// or image rules — listings.ts just supplies the listing id.
export function listingImageAdapter(ctx: {
  listingId: string
  supabase: SupabaseClient
}): UploadAdapter {
  return {
    bucket: "listing-images",
    upsert: false,
    validate: (file) => validateImageFile(file),
    path: async (file, i) => {
      const ext = EXT_BY_MIME[(await detectImageMime(file)) ?? ""] ?? "jpg"
      return `${ctx.listingId}/${randomUUID()}-${i}.${ext}`
    },
    reconcile: async (publicUrl, _file, i) => {
      const { error } = await ctx.supabase.from("listing_images").insert({
        listing_id: ctx.listingId,
        image_url: publicUrl,
        display_order: i,
        alt_text: null,
      })
      return error ? error.message : null
    },
  }
}
