import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth"
import { OnboardingForm } from "@/components/auth/onboarding-form"

export const metadata: Metadata = {
  title: "Finish setting up your account",
  description: "Complete your VinTech Marketplace profile.",
}

export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.profileCompleted) redirect("/profile")

  return <OnboardingForm fullName={user.fullName ?? ""} />
}