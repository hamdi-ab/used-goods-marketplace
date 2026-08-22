import type { Metadata } from "next"

import { requireSeller } from "@/lib/auth"
import { fetchCategories } from "@/lib/listings"
import { fetchAccountUsage } from "@/lib/usage"
import { CreateListingForm } from "@/components/listings/create-listing-form"
import { PrototypeCreatePage } from "@/components/listings/prototype-create-page"

export const metadata: Metadata = {
  title: "Sell an item",
  description: "Create a listing on the VinTech Marketplace.",
}

const VARIANT_KEYS = ["A", "B"] as const
type VariantKeyList = (typeof VARIANT_KEYS)[number]

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = VARIANT_KEYS.includes(variant as VariantKeyList)
    ? (variant as "A" | "B")
    : null

  if (key) {
    return <PrototypeCreatePage variant={key} />
  }

  const seller = await requireSeller()

  const categories = await fetchCategories()

  const usage = await fetchAccountUsage(seller.id)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Sell an item
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        List your item once, reach buyers across Addis Ababa.
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