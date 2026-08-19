import { Suspense } from "react"

import { TIER_LIMITS, TIER_LABELS, type Tier } from "@/lib/plans/constants"
import { StartProForm } from "@/components/pricing/start-pro-form"

const TIERS_IN_ORDER: Tier[] = ["free", "pro", "business"]

export const metadata = {
  title: "VinTech pricing",
  description: "VinTech marketplace plans. The core marketplace stays free; Pro adds capacity for frequent sellers.",
}

/** Tier-limit table columns that map 1:1 to a numeric TIER_LIMITS field. */
type LimitFeature = "activeListings" | "imagesPerListing" | "aiGenerationsPerMonth"

/** Format a tier limit for the pricing table. Null (uncapped AI) reads as
 * "Higher"; business active-listings/images render with the §36 hypothesis
 * suffix ("+"/">") while still reading the real constant from TIER_LIMITS. */
function formatLimit(tier: Tier, kind: LimitFeature): string {
  const value = TIER_LIMITS[tier][kind]
  if (value === null) return "Higher"
  if (tier === "business" && kind === "activeListings") return `${value}+`
  if (tier === "business" && kind === "imagesPerListing") return `>${value}`
  return String(value)
}

/** Tier-limit table row: each column is formatted from TIER_LIMITS so the
 * numbers can't drift from the constants. */
function LimitRow({ feature, kind }: { feature: string; kind: LimitFeature }) {
  return (
    <tr>
      <td className="py-3 text-sm text-muted-foreground">{feature}</td>
      <td className="py-3 text-sm">{formatLimit("free", kind)}</td>
      <td className="py-3 text-sm font-medium text-primary">{formatLimit("pro", kind)}</td>
      <td className="py-3 text-sm">{formatLimit("business", kind)}</td>
    </tr>
  )
}

/** Qualitative feature row (no corresponding TIER_LIMITS number). */
function FeatureRow({ feature, free, pro, business }: {
  feature: string
  free: string
  pro: string
  business: string
}) {
  return (
    <tr>
      <td className="py-3 text-sm text-muted-foreground">{feature}</td>
      <td className="py-3 text-sm">{free}</td>
      <td className="py-3 text-sm font-medium text-primary">{pro}</td>
      <td className="py-3 text-sm">{business}</td>
    </tr>
  )
}

export default function PricingPage() {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col items-center px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-10 text-center">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Simple pricing, Addis-first
        </h1>
        <p className="mt-3 max-w-2xl text-balance text-sm text-muted-foreground">
          The core marketplace is free for everyone. Pro adds capacity and
          analytics for frequent sellers. Pricing is being validated — no
          charges today.
        </p>
      </header>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-center">
          <thead>
            <tr>
              {TIERS_IN_ORDER.map((t) => (
                <th
                  key={t}
                  className={
                    t === "pro"
                        ? "border-b-2 border-primary px-4 py-3 text-sm font-semibold text-primary"
                        : "border-b px-4 py-3 text-sm font-medium text-muted-foreground"
                  }
                >
                  <Suspense fallback={t}>{TIER_LABELS[t]}</Suspense>
                  {t === "pro" ? (
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      199 ETB<span className="text-base font-medium text-muted-foreground">/mo</span>
                    </p>
                  ) : t === "business" ? (
                    <p className="mt-1 text-sm font-medium text-muted-foreground">Contact us</p>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-muted-foreground">Free</p>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <LimitRow feature="Active listings" kind="activeListings" />
            <LimitRow feature="Images per listing" kind="imagesPerListing" />
            <LimitRow feature="AI generations / month" kind="aiGenerationsPerMonth" />
            <FeatureRow
              feature="Advanced analytics"
              free="—"
              pro="Included"
              business="Included"
            />
            <FeatureRow
              feature="Price insights"
              free="—"
              pro="Included"
              business="Included"
            />
            <FeatureRow
              feature="Business storefront"
              free="—"
              pro="—"
              business="Included"
            />
            <FeatureRow
              feature="Listing boosts"
              free="Add-on"
              pro="Add-on"
              business="Add-on"
            />
            <tr>
              <td colSpan={4} className="py-4 text-left">
                <span className="text-xs text-muted-foreground">
                  Business tier and exact Pro pricing are hypotheses being
                  validated against local usage — the cap shown here is the
                  strategy §36 target (100+), not a promise.
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <Suspense
        fallback={
          <p className="mt-8 text-sm text-muted-foreground">Pricing is loading…</p>
        }
      >
        <StartProForm />
      </Suspense>

      <p className="mt-8 max-w-xl text-center text-xs text-muted-foreground">
        No subscription is required to sell. Paid features only unlock more
        capacity and tools; creating and selling stays free. We'll email you
        when billing opens — no charges until then.
      </p>
    </main>
  )
}
