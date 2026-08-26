import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { OnboardingForm } from "@/components/auth/onboarding-form"

export const metadata: Metadata = {
  title: "Finish setting up your account",
  description: "Complete your Dagim Gebeya profile.",
}

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.profileCompleted) redirect("/profile")

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <Link
        href="/sell"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to sell
      </Link>
      <OnboardingForm fullName={user.fullName ?? ""} />
    </main>
  )
}
