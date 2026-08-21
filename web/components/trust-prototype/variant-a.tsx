import {
  BadgeCheck,
  CheckCircle2,
  Phone,
  ShieldCheck,
} from "lucide-react"

import { MOCK } from "./variants"

// PROTOTYPE — Variant A "Badge-led". Trust badges are the hero: a big badge
// row on every seller surface, a "Verified sellers only" filter front and
// center, and each listing card carries the seller's badge set. Mercari-style.

function BadgeChip({ label, icon: Icon, tone }: {
  label: string
  icon: typeof ShieldCheck
  tone: "primary" | "blue" | "purple"
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      <Icon className="size-3" />
      {label}
    </span>
  )
}

function BadgeListingCard({ title, price, condition, city, seller }: {
  title: string
  price: number
  condition: string
  city: string
  seller: typeof MOCK.verified
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 flex aspect-[4/3] items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
        Photo
      </div>
      <p className="line-clamp-1 text-sm font-medium">{title}</p>
      <p className="text-sm font-semibold">ETB {price.toLocaleString()}</p>
      <p className="text-xs text-muted-foreground">{condition} · {city}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <BadgeChip label="Verified Seller" icon={ShieldCheck} tone="primary" />
        {seller.phone_verified && (
          <BadgeChip label="Phone Verified" icon={Phone} tone="blue" />
        )}
        {seller.fayda_verified && (
          <BadgeChip label="Fayda Verified" icon={BadgeCheck} tone="purple" />
        )}
      </div>
    </div>
  )
}

export function VariantA() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
          <ShieldCheck className="size-3.5" />
          Trust demo — badges first
        </p>
        <h1 className="mt-3 font-heading text-3xl font-bold">
          Buy from sellers who prove who they are
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Every listing shows the seller&apos;s earned verification badges.
          Only verified sellers can be surfaced by the filter.
        </p>
      </header>

      <section aria-label="Verified filter" className="mx-auto mb-10 max-w-2xl rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              defaultChecked
              className="size-4 accent-primary"
            />
            Verified sellers only
          </label>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-green-600" />
            12 verified sellers match
          </span>
        </div>
      </section>

      <section aria-label="Seller trust section" className="mx-auto mb-10 max-w-2xl rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
            AB
          </div>
          <div>
            <p className="font-semibold">{MOCK.verified.name}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <BadgeChip label="Verified Seller" icon={ShieldCheck} tone="primary" />
              <BadgeChip label="Phone Verified" icon={Phone} tone="blue" />
              <BadgeChip label="Fayda Verified" icon={BadgeCheck} tone="purple" />
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-semibold">{MOCK.verified.rating}★</p>
            <p className="text-xs text-muted-foreground">{MOCK.verified.reviews} reviews</p>
          </div>
        </div>
      </section>

      <section aria-label="Listing cards" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK.listings.map((l) => (
          <BadgeListingCard
            key={l.id}
            {...l}
            seller={MOCK.verified}
          />
        ))}
      </section>
    </main>
  )
}