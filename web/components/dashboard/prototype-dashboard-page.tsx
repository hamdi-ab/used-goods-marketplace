import Link from "next/link"
import {
  BellIcon,
  EyeIcon,
  HandshakeIcon,
  HeartIcon,
  InboxIcon,
  LayoutGridIcon,
  PlusIcon,
  SearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  UserRoundIcon,
} from "lucide-react"

import { ROLE_LABELS } from "@/lib/auth/types"
import { getCurrentUser } from "@/lib/auth"
import { fetchSellerListings } from "@/lib/listings"
import { countIncomingOffers, fetchBuyerOffers } from "@/lib/offers"
import { fetchFavoriteIds } from "@/lib/favorites"
import { fetchUnreadNotificationsCount } from "@/lib/notifications"
import { fetchOwnProfile } from "@/lib/profiles"
import { promoteToSeller } from "@/app/actions/profile"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import type { VariantKey } from "@/components/search/prototype-utils"
import { withVariant } from "@/components/search/prototype-utils"
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
  const [listings, openOffers, favorites, profile, buyerOffers, unread] =
    await Promise.all([
      canSell ? fetchSellerListings(user.id) : Promise.resolve([]),
      countIncomingOffers(user.id),
      fetchFavoriteIds(user.id),
      fetchOwnProfile(user.id),
      canSell ? Promise.resolve(null) : fetchBuyerOffers(user.id),
      fetchUnreadNotificationsCount(user.id),
    ])

  const firstName = user.fullName?.split(" ")[0] ?? "there"
  const liveListings = listings.filter((l) => l.status === "published").length
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count ?? 0), 0)
  const trustScore = profile?.trust_score ?? 50
  const trustWord = trustScore >= 70 ? "High" : trustScore >= 40 ? "Fair" : "Low"
  const myOffersCount = buyerOffers?.count ?? 0

  const stats = canSell
    ? [
        {
          label: "Live listings",
          value: liveListings,
          href: "/dashboard#listings",
          icon: LayoutGridIcon,
          accent: "text-[#2563EB]",
          sub:
            liveListings === 0
              ? "Nothing live yet"
              : "Published & live",
        },
        {
          label: "Total views",
          value: totalViews,
          href: "/dashboard#listings",
          icon: EyeIcon,
          accent: "text-[#2563EB]",
          sub: "Across your listings",
        },
        {
          label: "Open offers",
          value: openOffers,
          href: "/offers/seller",
          icon: InboxIcon,
          accent: "text-[#2563EB]",
          sub: openOffers === 0 ? "You're all caught up" : "Awaiting your reply",
        },
        {
          label: "Trust score",
          value: `${trustScore} / 100`,
          word: trustWord,
          icon: ShieldCheckIcon,
          accent:
            trustScore >= 70
              ? "text-emerald-600"
              : trustScore >= 40
                ? "text-amber-600"
                : "text-slate-500",
          sub: "Driven by verifications & reviews",
        },
      ]
    : [
        {
          label: "Favorites",
          value: favorites.length,
          href: "/favorites",
          icon: HeartIcon,
          accent: "text-rose-500",
          sub: "Saved listings",
        },
        {
          label: "My offers",
          value: myOffersCount,
          href: "/offers",
          icon: HandshakeIcon,
          accent: "text-[#2563EB]",
          sub: "Track the offers you've made",
        },
        {
          label: "Trust score",
          value: `${trustScore} / 100`,
          word: trustWord,
          icon: ShieldCheckIcon,
          accent:
            trustScore >= 70
              ? "text-emerald-600"
              : trustScore >= 40
                ? "text-amber-600"
                : "text-slate-500",
          sub: "Driven by verifications & reviews",
        },
        {
          label: "Notifications",
          value: unread,
          href: "/notifications",
          icon: BellIcon,
          accent: "text-[#2563EB]",
          sub: unread === 0 ? "You're all caught up" : "New activity to review",
        },
      ]

  const quickActions = canSell
    ? [
        {
          title: "Incoming offers",
          href: "/offers/seller",
          icon: InboxIcon,
          desc: "Accept, decline or counter offers",
        },
        {
          title: "Create a listing",
          href: "/sell",
          icon: PlusIcon,
          desc: "List an item with photos and a price",
        },
        {
          title: "Your listings",
          href: "/dashboard#listings",
          icon: LayoutGridIcon,
          desc: "Edit, archive, and track your listings",
        },
        {
          title: "Your profile",
          href: "/profile",
          icon: UserRoundIcon,
          desc: "Identity, trust and contact details",
        },
      ]
    : [
        {
          title: "Browse listings",
          href: "/search",
          icon: SearchIcon,
          desc: "Find your next purchase",
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
      ]

  const quickActionList = [
    ...quickActions,
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
          <p className="mt-2 max-w-xl text-foreground/70">
            Manage your marketplace activity from here — track offers and
            favorites, and keep on top of your listings.
          </p>
        </div>

        {/* Metric tiles above the fold */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground/70">
                    {s.label}
                  </span>
                  <s.icon className={cn("size-5", s.accent)} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-heading text-3xl font-extrabold tabular-nums tracking-tight",
                      s.href ? "text-foreground" : s.accent
                    )}
                  >
                    {s.value}
                  </span>
                  {s.word ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
                      {s.word}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-foreground/70">{s.sub}</span>
              </>
            )
            const cardClass = cn(
              "flex flex-col gap-2 rounded-2xl p-5 shadow-sm",
              tileClass
            )
            return s.href ? (
              <Link
                key={s.label}
                href={withVariant(s.href, variant)}
                className={cn(
                  cardClass,
                  "transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none"
                )}
              >
                {inner}
              </Link>
            ) : (
              <div key={s.label} className={cardClass}>
                {inner}
              </div>
            )
          })}
        </div>

        {/* Buyer → seller CTA */}
        {!canSell ? (
          <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-heading text-lg font-semibold">
                  Sell on the marketplace
                </h2>
                <p className="mt-1 text-sm text-foreground/70">
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
            {quickActionList.map((a) => (
              <Link
                key={a.title}
                href={withVariant(a.href, variant)}
                className={cn(
                  "group flex flex-col gap-2 rounded-2xl p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none motion-reduce:transition-none",
                  tileClass
                )}
              >
                <a.icon className="size-5 text-[#2563EB]" />
                <span className="font-semibold text-foreground">{a.title}</span>
                <span className="text-xs text-foreground/70">{a.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Listings manager */}
        {canSell ? (
          <section id="listings" className="mt-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-xl font-semibold">
                  Your listings
                </h2>
                <p className="text-sm text-foreground/70">
                  Edit, archive, or track views and favorites on your listings.
                </p>
              </div>
              <Button asChild>
                <Link href={withVariant("/sell", variant)}>
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