import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { Supabase } from "@/lib/supabase/types"

// ---- Row shapes ----

export interface OwnProfileRow {
  avatar_url: string | null
  full_name: string | null
  phone: string | null
  telegram_username: string | null
  city: string | null
  sub_city: string | null
  bio: string | null
  trust_score: number | null
  profile_completion: number | null
  role: "buyer" | "seller" | "admin" | null
  phone_public: boolean | null
}

export interface PublicProfileRow {
  full_name: string | null
  avatar_url: string | null
  city: string | null
  sub_city: string | null
  bio: string | null
  telegram_username: string | null
  phone: string | null
  trust_score: number | null
  role: "buyer" | "seller" | "admin" | null
  phone_public: boolean | null
  phone_verified: boolean | null
  fayda_verified: boolean | null
}

const OWN_PROFILE_COLUMNS =
  "avatar_url, full_name, phone, telegram_username, city, sub_city, bio, trust_score, profile_completion, role, phone_public"

const PUBLIC_PROFILE_COLUMNS =
  "full_name, avatar_url, city, sub_city, bio, telegram_username, trust_score, role, phone_public, phone_verified, fayda_verified"

// ---- Reads ----

/** Own-profile read for the /profile page. Cached so metadata and the body of a
 * request (and any sibling server component) share one round trip. */
export const fetchOwnProfile = cache(
  async (
    userId: string,
    client?: Supabase
  ): Promise<OwnProfileRow | null> => {
    const supabase = client ?? (await createClient())
    const { data: profile, error } = await supabase
      .from("profiles")
      .select(OWN_PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle()

    if (error || !profile) return null
    return profile as OwnProfileRow
  }
)

/** Public seller surface for the /users/[id] page. Cached so generateMetadata
 * and the page body share one round trip. Phone is fetched separately and only
 * when the owner has opted in (Security spec §19: phone is private by default).
 * Trust-badge flags (phone_verified, fayda_verified) are public by T12 RLS
 * design. */
export const fetchPublicProfile = cache(
  async (
    userId: string,
    client?: Supabase
  ): Promise<PublicProfileRow | null> => {
    const supabase = client ?? (await createClient())

    const { data: profile, error } = await supabase
      .from("profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .eq("id", userId)
      .maybeSingle()

    if (error || !profile) return null

    const row = profile as PublicProfileRow

    if (row.phone_public) {
      const { data: withPhone } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .maybeSingle()
      row.phone = withPhone?.phone ?? null
    }

    return row
  }
)

// ---- Writes ----

interface ProfileFields {
  full_name?: string | null
  city?: string | null
  sub_city?: string | null
  phone?: string | null
  telegram_username?: string | null
  bio?: string | null
  profile_completion?: number | null
  phone_public?: boolean | null
}

export async function updateProfileRow(
  userId: string,
  fields: ProfileFields
): Promise<{ ok: boolean; error: string | null }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)

  if (error) return { ok: false, error: error.message }
  return { ok: true, error: null }
}

/** Onboarding completion: persists the profile's initial fields and marks the
 * profile complete (profile_completion: 100 is the domain rule that flips the
 * "complete your profile" gate). Telegram handles are normalized here so the
 * rule lives next to the write, not in the action. */
export async function completeOwnProfile(
  userId: string,
  values: {
    fullName: string
    city: string
    subCity?: string
    phone?: string
    telegramUsername?: string
    bio?: string
  }
): Promise<{ ok: boolean; error: string | null }> {
  return updateProfileRow(userId, {
    full_name: values.fullName,
    city: values.city,
    sub_city: values.subCity || null,
    phone: values.phone || null,
    telegram_username: values.telegramUsername
      ? values.telegramUsername.replace(/^@/, "")
      : null,
    bio: values.bio || null,
    profile_completion: 100,
  })
}

/** Editable profile fields from the /profile page form. */
export async function updateOwnProfile(
  userId: string,
  values: {
    city: string
    subCity?: string
    phone?: string
    telegramUsername?: string
    bio?: string
    phonePublic?: boolean
  }
): Promise<{ ok: boolean; error: string | null }> {
  return updateProfileRow(userId, {
    city: values.city,
    sub_city: values.subCity || null,
    phone: values.phone || null,
    telegram_username: values.telegramUsername || null,
    bio: values.bio || null,
    phone_public: values.phonePublic ?? false,
  })
}