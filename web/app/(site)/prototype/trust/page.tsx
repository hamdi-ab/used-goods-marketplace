import type { Metadata } from "next"
import { Suspense } from "react"

import { TrustPrototypeSwitcher } from "@/components/trust-prototype/switcher"
import { PROTOTYPE_VARIANTS } from "@/components/trust-prototype/variants"
import { VariantA } from "@/components/trust-prototype/variant-a"
import { VariantB } from "@/components/trust-prototype/variant-b"
import { VariantC } from "@/components/trust-prototype/variant-c"

// PROTOTYPE — trust-surfacing demo (issue #101). Throwaway route: three
// structurally different takes on how trust signals appear in the 5-minute
// judge demo, switchable via ?variant= (dev only). No real data fetching.

export const metadata: Metadata = {
  title: "Trust surfacing prototype",
  description: "Prototype: how trust surfaces in the judge demo (issue #101).",
}

export default async function TrustPrototypePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const key = PROTOTYPE_VARIANTS.some((v) => v.key === sp.variant)
    ? (sp.variant as "A" | "B" | "C")
    : "A"

  return (
    <>
      {key === "A" && <VariantA />}
      {key === "B" && <VariantB />}
      {key === "C" && <VariantC />}
      <Suspense>
        <TrustPrototypeSwitcher />
      </Suspense>
    </>
  )
}