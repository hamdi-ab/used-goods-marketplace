import Link from "next/link"
import {
  HandshakeIcon,
  HeartIcon,
  InboxIcon,
  LayoutGridIcon,
  PlusIcon,
  ShieldIcon,
  ShieldCheckIcon,
  UserRoundIcon,
} from "lucide-react"

import { ROLE_LABELS } from "@/lib/auth/types"
import { getCurrentUser } from "@/lib/auth"
import { fetchSellerListings } from "@/lib/listings"
import { countIncomingOffers } from "@/lib/offers"
import { fetchFavoriteIds } from "@/lib/favorites"
import { fetchOwnProfile } from "@/lib/profiles"
import { promoteToSeller } from "@/app/actions/profile"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import type { VariantKey } from "@/components/search/prototype-utils"
import { ListingManager } from "@/components/dashboard/listing-manager"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// PROTOTYPE — dashboard redesign variants (?variant=A|B, dev only). Option A
// "Metrics First" (moodboard #1): stat tiles above the fold, quick-action grid,
// then the listings manager. View-only during review: signed-out visitors see
// an empty state instead of a redirect. Variant B tints the metric tiles blue.
export async function PrototypeDashboardPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <>
        <PrototypeHeader variant={variant} />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-16">
          <h1 className="font-heading text-xl font-semibold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to view your dashboard.
          </p>
        </main>
        <PrototypeFooter variant={variant} />
      </>
    )
  }

  const canSell = user.role === "seller" || user.role === "admin"
  const [listings, openOffers, favorites, profile] = await Promise.all([
    canSell ? fetchSellerListings(user.id) : Promise.resolve([]),
    countIncomingOffers(user.id),
    fetchFavoriteIds(user.id),
    fetchOwnProfile(user.id),
  ])

  const firstName = user.fullName?.split(" ")[0] ?? "there"
  const liveListings = listings.filter((l) => l.status === "published").length
  const trustScore = profile?.trust_score ?? 50

  const stats = [
    {
      label: "Live listings",
      value: liveListings,
      icon: LayoutGridIcon,
      accent: "text-[#2563EB]",
      sub: canSell ? "Published & live" : "Start selling to unlock",
    },
    {
      label: "Open offers",
      value: openOffers,
      icon: InboxIcon,
      accent: "text-[#2563EB]",
      sub: "Awaiting your reply",
    },
    {
      label: "Favorites",
      value: favorites.length,
      icon: HeartIcon,
      accent: "text-rose-500",
      sub: "Saved listings",
    },
    {
      label: "Trust score",
      value: trustScore,
      icon: ShieldCheckIcon,
      accent: trustScore >= 70 ? "text-emerald-600" : trustScore >= 40 ? "text-amber-600" : "text-slate-500",
      sub: "Driven by verifications & reviews",
    },
  ]

  const quickActions = [
    {
      title: "Incoming offers",
      href: "/offers/seller",
      icon: InboxIcon,
      desc: "Accept, decline or counter offers",
    },
    {
      title: "My offers",
      href: "/offers",
      icon: HandshakeIcon,
      desc: "Track the offers you've made",
    },
    {
      title: "Favorites",
      href: "/favorites",
      icon: HeartIcon,
      desc: "Listings you saved for later",
    },
    {
      title: "Your profile",
      href: "/profile",
      icon: UserRoundIcon,
      desc: "Identity, trust and contact details",
    },
    ...(user.role === "admin"
      ? [
          {
            title: "Moderation",
            href: "/admin",
            icon: ShieldIcon,
            desc: "Manage users, listings and reports",
          },
        ]
      : []),
  ]

  const tileClass =
    variant === "B"
      ? "border-[#2563EB]/30 bg-[#EEF4FF]"
      : "border bg-card"

  return (
    <>
      <PrototypeHeader variant={variant} />

      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Compact welcome header */}
        <div className="mb-8">
          <Badge variant="secondary">
            {ROLE_LABELS[user.role] ?? "Buyer"}
          </Badge>
          <h1 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Manage your marketplace activity from here — track offers and
            favorites, and keep on top of your listings.
          </p>
        </div>

        {/* Metric tiles above the fold */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className={cn(
                "flex flex-col gap-2 rounded-2xl p-5 shadow-sm",
                tileClass
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </span>
                <s.icon className={cn("size-4.5", s.accent)} />
              </div>
              <span className={cn("font-heading text-3xl font-extrabold", s.accent)}>
                {s.value}
              </span>
              <span className="text-xs text-muted-foreground">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* Buyer → seller CTA */}
        {!canSell ? (
          <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Sell on the marketplace
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  When you start selling, your listings, their stats, and
                  incoming offers will live here.
                </p>
              </div>
              <form action={promoteToSeller}>
                <Button type="submit" variant="outline">
                  Start selling
                </Button>
              </form>
            </div>
          </div>
        ) : null}

        {/* Quick actions */}
        <section className="mt-10">
          <h2 className="font-heading mb-4 text-xl font-semibold">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className={cn(
                  "group flex flex-col gap-2 rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                  tileClass
                )}
              >
                <a.icon className="size-5 text-[#2563EB]" />
                <span className="font-semibold text-foreground">{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Listings manager */}
        {canSell ? (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  Your listings
                </h2>
                <p className="text-sm text-muted-foreground">
                  Edit, archive, or track views and favorites on your listings.
                </p>
              </div>
              <Button asChild size="sm">
                <Link href="/sell">
                  <PlusIcon className="mr-1.5 size-4" />
                  Create a listing
                </Link>
              </Button>
            </div>
            <ListingManager listings={listings} />
          </section>
        ) : null}
      </main>

      <PrototypeFooter variant={variant} />
    </>
  )
}