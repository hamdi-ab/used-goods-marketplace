import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { fetchOwnProfile, type OwnProfileRow } from "@/lib/profiles"
import { fetchMyVerifications } from "@/lib/verifications"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your VinTech Marketplace profile.",
}

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const [profile, verifications] = await Promise.all([
    fetchOwnProfile(user.id),
    fetchMyVerifications(user.id),
  ])

  return (
    <ProfileForm
      user={user}
      profile={(profile ?? {}) as OwnProfileRow}
      verifications={verifications}
    />
  )
}
