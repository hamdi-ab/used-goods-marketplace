import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { OnboardingForm } from "@/components/auth/onboarding-form"
import { PrototypeOnboardingPage } from "@/components/auth/prototype-onboarding-page"

export const metadata: Metadata = {
  title: "Finish setting up your account",
  description: "Complete your VinTech Marketplace profile.",
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = variant === "A" || variant === "B" ? (variant as "A" | "B") : null

  // PROTOTYPE — the redesign variant is view-only during review and bypasses
  // the signed-in/profile-completed redirects (see proxy.ts).
  if (key) {
    return <PrototypeOnboardingPage variant={key} />
  }

  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.profileCompleted) redirect("/profile")

  return <OnboardingForm fullName={user.fullName ?? ""} />
}