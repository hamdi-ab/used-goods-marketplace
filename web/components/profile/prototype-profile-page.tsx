import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import type { VariantKey } from "@/components/search/prototype-utils"
import { getCurrentUser } from "@/lib/auth"
import { fetchOwnProfile, type OwnProfileRow } from "@/lib/profiles"
import { fetchMyVerifications } from "@/lib/verifications"

import { PrototypeProfileContent } from "./prototype-profile-content"

// PROTOTYPE — profile-page redesign (?variant=A|B, dev only). View-only during
// review: signed-out visitors see an empty state instead of being redirected,
// so the proxy's ?variant bypass is enough to preview the layout.
export async function PrototypeProfilePage({ variant }: { variant: VariantKey }) {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <>
        <PrototypeHeader variant={variant} />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view and edit your profile.
          </p>
        </main>
        <PrototypeFooter variant={variant} />
      </>
    )
  }

  const [profile, verifications] = await Promise.all([
    fetchOwnProfile(user.id),
    fetchMyVerifications(user.id),
  ])

  return (
    <>
      <PrototypeHeader variant={variant} />
      <PrototypeProfileContent
        variant={variant}
        user={user}
        profile={(profile ?? {}) as OwnProfileRow}
        verifications={verifications}
      />
      <PrototypeFooter variant={variant} />
    </>
  )
}