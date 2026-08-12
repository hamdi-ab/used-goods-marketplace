import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your VinTech Marketplace profile.",
}

type ProfileRow = {
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

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "avatar_url, full_name, phone, telegram_username, city, sub_city, bio, trust_score, profile_completion, role, phone_public"
    )
    .eq("id", user.id)
    .maybeSingle()

  return (
    <ProfileForm user={user} profile={(profile ?? {}) as ProfileRow} />
  )
}
