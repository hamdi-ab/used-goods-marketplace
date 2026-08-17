/**
 * Profile completion (fix #82). Server-free so the client editor can render a
 * live progress bar, and unit-testable without the DB graph. The formula
 * mirrors the generated column in
 * web/supabase/migrations/20260817190000_compute_profile_completion.sql
 * (PRD FR 112-122: 20% per populated field — trimmed, empty strings count as
 * missing).
 */
export const PROFILE_COMPLETION_FIELDS = [
  { key: "avatar_url", label: "profile photo" },
  { key: "phone", label: "phone number" },
  { key: "telegram_username", label: "Telegram" },
  { key: "city", label: "city" },
  { key: "bio", label: "bio" },
] as const

export interface ProfileCompletionInput {
  avatar_url: string | null
  phone: string | null
  telegram_username: string | null
  city: string | null
  bio: string | null
}

export function computeProfileCompletion(row: ProfileCompletionInput): number {
  const filled = PROFILE_COMPLETION_FIELDS.filter(({ key }) => {
    const value = row[key]
    return typeof value === "string" && value.trim().length > 0
  }).length
  return filled * 20
}
