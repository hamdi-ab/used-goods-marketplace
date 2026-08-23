import { Suspense } from "react"

import { TIER_LIMITS, TIER_LABELS, type Tier } from "@/lib/plans/constants"
import { StartProForm } from "@/components/pricing/start-pro-form"

const TIERS_IN_ORDER: Tier[] = ["free", "pro", "business"]

export const metadata = {
  title: "Dagim Gebeya pricing",
  description: "Dagim Gebeya marketplace plans. The core marketplace stays free; Pro adds capacity for frequent sellers.",
}

type LimitFeature = "activeListings" | "imagesPerListing" | "aiGenerationsPerMonth"

function formatLimit(tier: Tier, kind: LimitFeature): string {
  const value = TIER_LIMITS[tier][kind]
  if (value === null) return "Higher"
  if (tier === "business" && kind === "activeListings") return `${value}+`
  if (tier === "business" && kind === "imagesPerListing") return `>${value}`
  return String(value)
}

const LIMIT_ROWS: { feature: string; kind: LimitFeature }[] = [
  { feature: "Active listings", kind: "activeListings" },
  { feature: "Images per listing", kind: "imagesPerListing" },
  { feature: "AI generations / month", kind: "aiGenerationsPerMonth" },
]

const FEATURE_ROWS: { feature: string; free: string; pro: string; business: string }[] = [
  { feature: "Advanced analytics", free: "—", pro: "Included", business: "Included" },
  { feature: "Price insights", free: "—", pro: "Included", business: "Included" },
  { feature: "Business storefront", free: "—", pro: "—", business: "Included" },
  { feature: "Listing boosts", free: "Add-on", pro: "Add-on", business: "Add-on" },
]

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const upgradeStatus = typeof sp.upgrade === "string" ? sp.upgrade : null

  return (
    <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Demo mode — Chapa test transactions only
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Simple pricing, free to start
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-muted-foreground">
          List and sell at no cost. Upgrade when you need more capacity, AI credits, and analytics.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {TIERS_IN_ORDER.map((t) => {
          const isPro = t === "pro"
          return (
            <div
              key={t}
              className={[
                "relative flex flex-col rounded-2xl border bg-card p-6",
                isPro ? "border-primary shadow-lg ring-1 ring-primary/20" : "border-border",
              ].join(" ")}
            >
              {isPro ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Most popular
                </div>
              ) : null}

              <div className="mb-6">
                <h2 className={["font-heading text-lg font-semibold", isPro ? "text-primary" : "text-foreground"].join(" ")}>
                  <Suspense fallback={t}>{TIER_LABELS[t]}</Suspense>
                </h2>
                <div className="mt-2">
                  {t === "pro" ? (
                    <p className="flex items-baseline gap-1">
                      <span className="font-heading text-3xl font-bold text-foreground">199</span>
                      <span className="text-sm text-muted-foreground">ETB / mo</span>
                    </p>
                  ) : t === "business" ? (
                    <p className="font-heading text-lg font-medium text-muted-foreground">Contact us</p>
                  ) : (
                    <p className="font-heading text-lg font-medium text-muted-foreground">Free</p>
                  )}
                </div>
              </div>

              <dl className="mb-6 flex-1 space-y-3">
                {LIMIT_ROWS.map((row) => (
                  <div key={row.feature} className="flex items-center justify-between text-sm">
                    <dt className="text-muted-foreground">{row.feature}</dt>
                    <dd className={["font-medium", isPro ? "text-primary" : "text-foreground"].join(" ")}>
                      {formatLimit(t, row.kind)}
                    </dd>
                  </div>
                ))}
                {FEATURE_ROWS.map((row) => {
                  const value = t === "free" ? row.free : t === "pro" ? row.pro : row.business
                  return (
                    <div key={row.feature} className="flex items-center justify-between text-sm">
                      <dt className="text-muted-foreground">{row.feature}</dt>
                      <dd className={["font-medium", isPro ? "text-primary" : "text-foreground"].join(" ")}>
                        {value}
                      </dd>
                    </div>
                  )
                })}
              </dl>

              {t === "pro" ? (
                <Suspense fallback={<div className="h-10" />}>
                  <StartProForm />
                </Suspense>
              ) : t === "business" ? (
                <a
                  href="/contact"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Contact sales
                </a>
              ) : (
                <a
                  href="/sell"
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Start for free
                </a>
              )}
            </div>
          )
        })}
      </div>

      {upgradeStatus === "ok" ? (
        <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="font-medium text-emerald-800">Upgrade complete — you are now on Pro!</p>
          <p className="mt-1 text-sm text-emerald-600">
            Your tier has been activated. Enjoy 25 listings, 30 AI credits, and analytics.
          </p>
        </div>
      ) : upgradeStatus === "failed" ? (
        <div className="mt-8 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="font-medium text-destructive">Upgrade could not be applied — please try again.</p>
        </div>
      ) : null}

      <div className="mt-12 space-y-4 rounded-2xl border bg-muted/50 p-6">
        <h3 className="font-heading text-base font-semibold">Common questions</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-foreground">Do I need a subscription to sell?</p>
            <p className="mt-1 text-muted-foreground">No. Listing, selling, and buying are always free. Pro only adds capacity and tools.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Can I cancel Pro anytime?</p>
            <p className="mt-1 text-muted-foreground">Yes. Cancel from your account settings — no lock-in, no questions.</p>
          </div>
          <div>
            <p className="font-medium text-foreground">What payment methods do you accept?</p>
            <p className="mt-1 text-muted-foreground">Payments are processed by Chapa. All major Ethiopian banks and mobile money are supported.</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Business tier pricing is custom. Contact us for storefront and multi-user features.
      </p>
    </main>
  )
}
