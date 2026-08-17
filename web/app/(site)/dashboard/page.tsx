import type { Metadata } from "next"
import Link from "next/link"
import { HeartIcon, InboxIcon, HandshakeIcon, LayoutDashboardIcon, PlusIcon, ShieldIcon, UserRoundIcon } from "lucide-react"

import { requireUser, ROLE_LABELS } from "@/lib/auth"
import { fetchSellerListings } from "@/lib/listings"
import { countIncomingOffers } from "@/lib/offers"
import { ListingManager } from "@/components/dashboard/listing-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your VinTech Marketplace dashboard.",
}

export default async function DashboardPage() {
  const user = await requireUser()
  // The seller home only makes sense for users who can sell; buyers land on the
  // profile gate instead of a dead-end /sell redirect (issue #13 AC5).
  const canSell = user.role === "seller" || user.role === "admin"

  const [listings, openOfferCount] = await Promise.all([
    canSell ? fetchSellerListings(user.id) : Promise.resolve([]),
    countIncomingOffers(user.id),
  ])

  const firstName = user.fullName?.split(" ")[0] ?? "there"

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? "Buyer"}</Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your marketplace activity from here — track offers and
          favorites, and keep on top of your listings.
        </p>
      </div>

      {canSell ? (
        <section className="mb-10">
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
          <ListingManager listings={listings} />
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
            <Button asChild variant="outline">
              <Link href="/profile">Get started</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboardIcon className="size-5 text-primary" />
              Role
            </CardTitle>
            <CardDescription>
              Your account role is <span className="font-medium text-foreground">{ROLE_LABELS[user.role] ?? user.role}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              New accounts start as buyers. Selling tools unlock when listings go live.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}