import type { Metadata } from "next"

import { requireTrader } from "@/lib/auth"
import { fetchCategories } from "@/lib/listings"
import { fetchAccountUsage } from "@/lib/usage"
import { CreateListingForm } from "@/components/listings/create-listing-form"
import { SellerOnboardingCard } from "@/components/listings/seller-onboarding-card"

export const metadata: Metadata = {
  title: "Sell an item",
  description: "Create a listing on Dagim Gebeya.",
}

export default async function SellPage() {
  const user = await requireTrader()

  // Only buyers need onboarding — sellers go straight to listing form
  if (user.role === "buyer") {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Start selling
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us a little about you to start listing items.
        </p>
        <SellerOnboardingCard fullName={user.fullName} />
      </main>
    )
  }

  const categories = await fetchCategories()
  const usage = await fetchAccountUsage(user.id)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Sell an item
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        List your item once, reach buyers across Ethiopia.
      </p>

      <CreateListingForm
        categories={categories}
        aiCredits={{
          used: usage.aiGenerations.used,
          limit: usage.aiGenerations.limit,
        }}
      />
    </main>
  )
}
