import { randomUUID } from "node:crypto"

import {
  ALLOWED_IMAGE_MIME,
  detectImageMime,
  EXT_BY_MIME,
  MAX_IMAGE_BYTES,
} from "./primitives"
import type { Supabase, UploadAdapter } from "@/lib/media"

// The listing gallery adapter: bucket + path + validate + reconcile for a
// listing's photos. One of the two adapters behind the shared Media upload
// seam (the other is the profile avatar, ./avatar-adapter). Lives in the media
// layer so the listing domain never knows storage bucket names, object paths
// or image rules — listings.ts just supplies the listing id.
export function listingImageAdapter(ctx: {
  listingId: string
  supabase: Supabase
}): UploadAdapter {
  return {
    bucket: "listing-images",
    upsert: false,
    validate: async (file) => {
      const detected = await detectImageMime(file)
      if (!detected || !ALLOWED_IMAGE_MIME.includes(detected)) {
        return `${file.name || "Photo"} is not a valid JPG, PNG or WebP image`
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return "Each photo must be 5 MB or smaller"
      }
      return null
    },
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
