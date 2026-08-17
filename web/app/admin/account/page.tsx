import type { Metadata } from "next"

import { getCurrentUser } from "@/lib/auth"
import { fetchOwnProfile } from "@/lib/profiles"
import { AdminAccountForm } from "@/components/admin/admin-account-form"

export const metadata: Metadata = {
  title: "Admin — Account",
  description: "Your admin account details.",
}

export default async function AdminAccountPage() {
  const user = await getCurrentUser()
  if (!user) return null

  const profile = await fetchOwnProfile(user.id)

  return (
    <AdminAccountForm
      user={user}
      profile={{
        avatar_url: profile?.avatar_url ?? null,
        full_name: profile?.full_name ?? null,
        role: profile?.role ?? null,
      }}
    />
  )
}