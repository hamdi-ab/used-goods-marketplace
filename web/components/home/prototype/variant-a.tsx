import Image from "next/image"
import Link from "next/link"
import { BadgeCheck, Handshake, Sparkles } from "lucide-react"

import type { Category, BrowseListing } from "@/lib/listings"
import { Button } from "@/components/ui/button"
import { CategoryPills } from "@/components/home/prototype/category-pills"
import { ListingsBento } from "@/components/home/prototype/listings-bento"

interface VariantAProps {
  categories: Category[]
  listings: BrowseListing[]
  favoriteIds: Set<string> | null
}

const TRUST_CARDS = [
  {
    image: "/images/illustrations/trust-verified-seller.png",
    title: "Verified sellers",
    body: "Fayda ID and phone checks on every trusted seller, with a visible trust score.",
  },
  {
    image: "/images/illustrations/trust-safe-transactions.png",
    title: "Safe transactions",
    body: "Meet in person, inspect the item, and pay only when you're happy.",
  },
  {
    image: "/images/illustrations/trust-community-marketplace.png",
    title: "A real community",
    body: "Local buyers and sellers across Addis Ababa, backed by reviews and reports.",
  },
]

const STEPS = [
  {
    image: "/images/illustrations/onboarding-create-account.png",
    title: "Find it",
    body: "Browse fresh listings from verified local sellers across every category.",
  },
  {
    image: "/images/illustrations/onboarding-list-item.png",
    title: "Make an offer",
    body: "Negotiate the price and agree on a meetup through safe, in-app contact.",
  },
  {
    image: "/images/illustrations/onboarding-receive-offers.png",
    title: "Meet & buy",
    body: "Inspect the item in person, pay securely, and walk away happy.",
  },
]

const HERO_STATS = [
  { value: "1–5★", label: "seller reviews" },
  { value: "Live", label: "favorite & offer tracking" },
  { value: "Free", label: "to list and browse" },
]

// PROTOTYPE — Variant A "classic hero" (eBay-premium landing). Full-bleed
// gradient hero with the signature illustration, trust cards, how-it-works,
// categories, fresh listings, and a closing CTA band. Throwaway for design
// comparison; do not treat as production.
export function VariantA({ categories, listings, favoriteIds }: VariantAProps) {

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6">
      <section className="relative mt-6 overflow-hidden rounded-3xl border bg-gradient-to-br from-primary via-[#1E40AF] to-[#172554] text-white sm:mt-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative z-10 grid gap-10 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-white ring-1 ring-white/20">
              <Sparkles className="size-3.5" />
              Ethiopia&apos;s trusted second-hand marketplace
            </div>
            <h1 className="mt-5 font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Buy and sell used goods with total confidence
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              Discover verified local sellers, inspect quality items, and
              transact securely across Addis Ababa — with reviews, trust
              scores, and reports keeping every deal honest.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/search">Browse listings</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/sell">Start selling</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <dt className="font-heading text-xl font-semibold">{s.value}</dt>
                  <dd className="mt-0.5 text-xs text-white/70">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <Image
                src="/images/illustrations/signature-vintech-hero.png"
                alt="Buyers and sellers connected across a trusted marketplace"
                width={1600}
                height={1000}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full"
              />
            </div>
            <div className="absolute -top-4 -right-4 hidden rounded-xl bg-white px-4 py-3 text-foreground shadow-xl sm:block">
              <span className="inline-flex items-center gap-1.5 text-sm">
                <BadgeCheck className="size-4 text-success" />
                Trusted by the community
              </span>
              <p className="mt-0.5 text-sm font-medium">
                Verified seller &middot; phone + Fayda ID
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Why trust us" className="mt-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Why VinTech
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
            A marketplace built on trust, not anonymous classifieds
          </h2>
          <p className="mt-3 text-muted-foreground">
            Peer-to-peer trade only works when buyers and sellers feel safe.
            That is why every listing is attached to a reviewed, verified
            seller — and why problems are easy to report and resolve.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {TRUST_CARDS.map((t) => (
            <div
              key={t.title}
              className="group overflow-hidden rounded-2xl border bg-background transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-[6/5] w-full bg-muted">
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <p className="font-heading text-lg font-semibold">{t.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{t.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="How it works" className="mt-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
            From listing to handshake in three steps
          </h2>
        </div>
        <ol className="mt-8 grid gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col overflow-hidden rounded-2xl border bg-background">
              <div className="relative aspect-[6/5] w-full bg-muted">
                <Image
                  src={s.image}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
                <span className="absolute left-3 top-3 flex size-8 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
              </div>
              <div className="flex-1 p-5">
                <p className="font-heading text-lg font-semibold">{s.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Browse by category" className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Shop by category
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
              Browse by category
            </h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary underline">
            View all
          </Link>
        </div>
        <div className="mt-6">
          <CategoryPills categories={categories} />
        </div>
      </section>

      <section id="listings" aria-label="Fresh listings" className="mt-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Just in
            </p>
            <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight">
              Fresh listings
            </h2>
          </div>
          <Link href="/search" className="text-sm font-medium text-primary underline">
            View all
          </Link>
        </div>
        <div className="mt-8">
          <ListingsBento listings={listings.slice(0, 11)} favoriteIds={favoriteIds} />
        </div>
      </section>

      <section className="mt-16 overflow-hidden rounded-3xl bg-gradient-to-br from-[#172554] via-[#1E40AF] to-primary text-white">
        <div className="grid items-center gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              Got something to sell?
            </h2>
            <p className="mt-3 max-w-md text-white/80">
              List an item in minutes with AI-assisted descriptions, reach
              verified local buyers, and get offers the same day.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link href="/sell">
                  <Handshake className="mr-2 size-4" />
                  Start selling
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link href="/search">Browse listings</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
              <Image
                src="/images/photos/photo-buyer-meeting-seller.png"
                alt="A buyer and seller meeting to hand over a purchased item"
                width={1600}
                height={1200}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
