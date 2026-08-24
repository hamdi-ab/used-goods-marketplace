import type { Metadata } from "next"
import Link from "next/link"
import { BellIcon, EyeIcon, HandshakeIcon, HeartIcon, InboxIcon, LayoutGridIcon, PlusIcon, ShieldCheckIcon, ShieldIcon, UserRoundIcon } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { requireUser, ROLE_LABELS } from "@/lib/auth"
import { fetchSellerListings } from "@/lib/listings"
import { fetchAccountUsage } from "@/lib/usage"
import { countIncomingOffers, fetchBuyerOffers } from "@/lib/offers"
import { fetchFavoriteIds } from "@/lib/favorites"
import { fetchUnreadNotificationsCount } from "@/lib/notifications"
import { fetchOwnProfile } from "@/lib/profiles"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { promoteToSeller } from "@/app/actions/profile"
import { ListingManager } from "@/components/dashboard/listing-manager"
import { AccountUsageCard } from "@/components/dashboard/account-usage-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your Dagim Gebeya dashboard.",
}

interface StatTile {
  label: string
  value: string | number
  href?: string
  icon: LucideIcon
  accent: string
  sub: string
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const user = await requireUser()
  const canSell = user.role === "seller" || user.role === "admin"
  const offset = parseOffset(sp.offset)

  const [openOfferCount, sellerUsage, sellerListings, favorites, buyerOffers, unread, profile] =
    await Promise.all([
      countIncomingOffers(user.id),
      canSell ? fetchAccountUsage(user.id) : Promise.resolve(null),
      canSell ? fetchSellerListings(user.id, { offset }) : Promise.resolve(null),
      fetchFavoriteIds(user.id),
      canSell ? Promise.resolve(null) : fetchBuyerOffers(user.id, { limit: 1 }),
      fetchUnreadNotificationsCount(user.id),
      fetchOwnProfile(user.id),
    ])
  const listings = sellerListings?.listings ?? []
  const firstName = user.fullName?.split(" ")[0] ?? "there"
  const liveListings = listings.filter((l) => l.status === "published").length
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count ?? 0), 0)
  const trustScore = profile?.trust_score ?? 50
  const trustWord = trustScore >= 70 ? "High" : trustScore >= 40 ? "Fair" : "Low"
  const myOffersCount = buyerOffers?.count ?? 0

  const sellerStats: StatTile[] = [
    { label: "Live listings", value: liveListings, href: "#listings", icon: LayoutGridIcon, accent: "text-[#2563EB]", sub: liveListings === 0 ? "Nothing live yet" : "Published & live" },
    { label: "Total views", value: totalViews, href: "#listings", icon: EyeIcon, accent: "text-[#2563EB]", sub: "Across your listings" },
    { label: "Open offers", value: openOfferCount, href: "/offers/seller", icon: InboxIcon, accent: "text-[#2563EB]", sub: openOfferCount === 0 ? "You're all caught up" : "Awaiting your reply" },
    { label: "Notifications", value: unread, href: "/notifications", icon: BellIcon, accent: "text-[#2563EB]", sub: unread === 0 ? "You're all caught up" : "New activity to review" },
    { label: "Trust score", value: `${trustScore} / 100`, icon: ShieldCheckIcon, accent: trustScore >= 70 ? "text-emerald-600" : trustScore >= 40 ? "text-amber-600" : "text-slate-500", sub: trustWord },
  ]

  const buyerStats: StatTile[] = [
    { label: "Favorites", value: favorites.length, href: "/favorites", icon: HeartIcon, accent: "text-rose-500", sub: "Saved listings" },
    { label: "My offers", value: myOffersCount, href: "/offers", icon: HandshakeIcon, accent: "text-[#2563EB]", sub: "Track the offers you've made" },
    { label: "Trust score", value: `${trustScore} / 100`, icon: ShieldCheckIcon, accent: trustScore >= 70 ? "text-emerald-600" : trustScore >= 40 ? "text-amber-600" : "text-slate-500", sub: trustWord },
  ]

  const stats = canSell ? sellerStats : buyerStats

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="mb-8">
        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? "Buyer"}</Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your marketplace activity from here.
        </p>
      </div>

      <section className="mb-10">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 min-[500px]:grid-cols-3">
          {stats.map((s) => {
            const Inner = (
              <div className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2">
                  <s.icon className={`size-4 ${s.accent}`} />
                  <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
                </div>
                <p className={`mt-2 font-heading text-xl font-bold ${s.accent}`}>{s.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.sub}</p>
              </div>
            )
            return s.href ? (
              <Link key={s.label} href={s.href} className="block">{Inner}</Link>
            ) : (
              <div key={s.label}>{Inner}</div>
            )
          })}
        </div>
      </section>

      {canSell ? (
        <section id="listings" className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold">Your listings</h2>
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

          {sellerUsage ? <AccountUsageCard usage={sellerUsage} /> : null}

          <ListingManager listings={listings} />

          {sellerListings?.hasMore ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/dashboard?offset=${nextOffset(offset)}`}
                className="text-sm font-medium underline"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <Card className="mb-10">
          <CardContent className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold">
                Sell on the marketplace
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                When you start selling, your listings, their stats, and incoming
                offers will live here.
              </p>
            </div>
            <form action={promoteToSeller}>
              <Button type="submit" variant="outline">
                Start selling
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {canSell ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InboxIcon className="size-5 text-primary" />
                Incoming offers
                {openOfferCount > 0 ? (
                  <Badge variant="secondary">{openOfferCount} open</Badge>
                ) : null}
              </CardTitle>
              <CardDescription>
                Accept, decline, or counter offers on your listings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/offers/seller">Manage offers</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HandshakeIcon className="size-5 text-primary" />
                My offers
              </CardTitle>
              <CardDescription>
                Track the offers you have made and any counter-offers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/offers">View my offers</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="size-5 text-primary" />
              Favorites
            </CardTitle>
            <CardDescription>
              Review the listings you have saved for later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/favorites">View favorites</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundIcon className="size-5 text-primary" />
              Your profile
            </CardTitle>
            <CardDescription>
              Check how buyers and sellers see you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/profile">View profile</Link>
            </Button>
          </CardContent>
        </Card>

        {user.role === "admin" ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldIcon className="size-5 text-primary" />
                Moderation
              </CardTitle>
              <CardDescription>
                Manage users, listings, and the moderation queue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/admin">Open admin</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
