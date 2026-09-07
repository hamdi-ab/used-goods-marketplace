import type { SupabaseClient } from "@supabase/supabase-js"

import { validateImageFile } from "./primitives"
import type { UploadAdapter } from "@/lib/media"

// Dispute evidence adapter: uploads images to the dispute_evidence bucket
// for use in dispute forms. Public read so admins can view evidence.
export function disputeEvidenceAdapter(ctx: {
  uid: string
  disputeId: string
  supabase: SupabaseClient
}): UploadAdapter {
  return {
    bucket: "dispute_evidence",
    upsert: false,
    validate: async (file) => {
      const error = await validateImageFile(file)
      if (error) {
        return "Upload a JPG, PNG or WebP image (max 5 MB)"
      }
      return null
    },
    path: (file) => {
      const ext = (file.name.split(".").pop() || "png").toLowerCase()
      return `${ctx.disputeId}/${ctx.uid}/${Date.now()}.${ext}`
    },
    reconcile: async () => {
      // Evidence URLs are collected by the caller, not persisted here
      return null
    },
  }
}
