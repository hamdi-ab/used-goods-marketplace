import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { fetchOwnProfile, type OwnProfileRow } from "@/lib/profiles"
import { fetchMyVerifications } from "@/lib/verifications"
import { faydaConfigured } from "@/lib/fayda/verification"
import { ProfileForm } from "@/components/profile/profile-form"

export const metadata: Metadata = {
  title: "Your profile",
  description: "Manage your Dagim Gebeya profile.",
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const params = await searchParams
  const [profile, verifications] = await Promise.all([
    fetchOwnProfile(user.id),
    fetchMyVerifications(user.id),
  ])

  return (
    <ProfileForm
      user={user}
      profile={(profile ?? {}) as OwnProfileRow}
      verifications={verifications}
      faydaAvailable={faydaConfigured()}
      faydaOutcome={
        params.verified === "fayda"
          ? { ok: !params.error, error: typeof params.error === "string" ? params.error : undefined }
          : null
      }
    />
  )
}
