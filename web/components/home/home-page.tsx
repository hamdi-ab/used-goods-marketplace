import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Quote, ShieldCheck, Sparkles, Star, TrendingUp, Zap } from "lucide-react"

import type { Category, BrowseListing } from "@/lib/listings"
import { Button } from "@/components/ui/button"
import { CategoryPills } from "@/components/home/category-pills"
import { ListingsBento } from "@/components/home/listings-bento"

interface HomePageProps {
  categories: Category[]
  listings: BrowseListing[]
  favoriteIds: Set<string> | null
}

const METRICS = [
  { icon: Star, value: "4.8 / 5", label: "average seller rating" },
  { icon: BadgeCheck, value: "100%", label: "of sellers identity-checked" },
  { icon: ShieldCheck, value: "24h", label: "moderator response on reports" },
]

// Home page — trust-forward marketplace design (Dagim Gebeya).
// Blue hero over a lifestyle photo, metric strip, editorial copy blocks,
// category rail, listings, and a testimonial.
export function HomePage({ categories, listings, favoriteIds }: HomePageProps) {

  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 sm:px-6">
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-[#3B82F6] text-white sm:mt-10">
        <div className="absolute inset-0">
          <Image
            src="/images/photos/photo-hero-section.png"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2563EB]/85 via-[#3B82F6]/70 to-transparent" />
        </div>
        <div className="relative z-10 px-6 py-16 sm:px-10 sm:py-24 lg:max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/90 fade-up" style={{ animationDelay: '0.1s' }}>
            Addis Ababa &middot; second-hand, reimagined
          </p>
          <h1 className="mt-4 font-heading text-4xl font-bold leading-tight tracking-tight sm:text-6xl fade-up" style={{ animationDelay: '0.2s' }}>
            Beautiful second-hand. Total peace of mind.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80 fade-up" style={{ animationDelay: '0.3s' }}>
            A curated marketplace where every seller is verified, every
            transaction is local, and every item has a story worth keeping.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row fade-up" style={{ animationDelay: '0.4s' }}>
            <Button asChild size="lg" className="press-feedback">
              <Link href="/search">Explore listings</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white press-feedback"
            >
              <Link href="/sell">Start selling</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-label="Marketplace metrics" className="border-b px-6 pb-10 pt-8 sm:px-10 overflow-hidden">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:gap-10">
          {METRICS.map((m) => (
            <div key={m.label} className="flex items-start gap-3 fade-up" style={{ animationDelay: `${0.1 * (METRICS.indexOf(m) + 1)}s` }}>
              <m.icon className="mt-1 size-5 text-primary" />
              <div>
                <p className="font-heading text-2xl font-bold">{m.value}</p>
                <p className="text-sm text-muted-foreground">{m.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              List in under 60 seconds
            </p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              AI writes your listing while you snap photos.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Snap a photo, and Dagim Gebeya fills in the title, description, and
              a suggested price. Edit what you want, or publish as-is. Free
              accounts get 3 AI assists per month.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/sell">
                  <Sparkles className="mr-2 size-4" />
                  Start selling
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">See plans</Link>
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-xl border bg-muted/50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Boost to the top</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pin your listing above search results for 3 or 7 days.
                </p>
                <p className="mt-1.5 text-sm font-semibold text-primary">49 – 99 ETB</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border bg-muted/50 p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="size-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Pro when you scale</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  25 listings, 30 AI credits, analytics, price insights.
                </p>
                <p className="mt-1.5 text-sm font-semibold text-primary">199 ETB / mo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-2 lg:items-center border-t">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Why Dagim Gebeya
          </p>
          <h2 className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Trade with people, not profiles.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every seller on Dagim Gebeya has passed an identity check and carries a
            live trust score built from real reviews. When you message, when
            you meet, when you hand over the cash — you know exactly who you
            are dealing with.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Phone + Fayda ID verification on every seller",
              "Public reviews and a composite trust score",
              "One-tap reporting with active moderation",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <BadgeCheck className="size-4 shrink-0 text-success" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Button asChild variant="outline">
              <Link href="/search">
                Browse the marketplace
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-sm">
          <Image
            src="/images/illustrations/trust-ai-listing.png"
            alt="AI listing assistant generating a listing from a phone photo"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </section>

      <section aria-label="Browse by category" className="border-t py-12">
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

      <section id="listings" aria-label="Fresh listings" className="py-12">
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

      <section aria-label="Testimonials" className="grid gap-6 rounded-3xl bg-muted/50 p-8 sm:grid-cols-2 sm:p-10">
        <div>
          <Quote className="size-6 text-primary" />
          <blockquote className="mt-3 font-heading text-xl font-semibold leading-snug">
            &ldquo;I sold my sofa within a day — the buyer verified my ID before
            we even met. That is how it should feel.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">
            Sara T. &middot; Seller, Bole
          </p>
        </div>
        <div>
          <Quote className="size-6 text-primary" />
          <blockquote className="mt-3 font-heading text-xl font-semibold leading-snug">
            &ldquo;The trust score is genius. I only buy from sellers with 4+ stars
            and I have never been disappointed.&rdquo;
          </blockquote>
          <p className="mt-3 text-sm text-muted-foreground">
            Dawit M. &middot; Buyer, Piassa
          </p>
        </div>
      </section>

      <section className="mt-12 overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-[#1D4ED8] text-white">
        <div className="flex flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {`Have an item to sell?`}
            </h2>
            <p className="mt-1.5 max-w-md text-white/80">
              {`Publish in minutes with AI help and reach verified local buyers today.`}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 press-feedback">
              <Link href="/sell">Start selling</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white press-feedback"
            >
              <Link href="/search">Browse listings</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
