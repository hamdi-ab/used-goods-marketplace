import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { fetchOwnProfile, type OwnProfileRow } from "@/lib/profiles"
import { fetchMyVerifications } from "@/lib/verifications"
import { ProfileForm } from "@/components/profile/profile-form"
import { PrototypeProfilePage } from "@/components/profile/prototype-profile-page"

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your VinTech Marketplace profile.",
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = variant === "A" || variant === "B" ? (variant as "A" | "B") : null

  // PROTOTYPE — the redesign variant is view-only during review and bypasses
  // the auth redirect (see proxy.ts) so ?variant=A|B renders without a session.
  if (key) {
    return <PrototypeProfilePage variant={key} />
  }

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
