import type { Metadata } from "next"
import Link from "next/link"
import { HeartIcon, InboxIcon, HandshakeIcon, LayoutDashboardIcon, PlusIcon, UserRoundIcon } from "lucide-react"

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
  const [listings, openOfferCount] = await Promise.all([
    fetchSellerListings(user.id),
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
          This is your selling home: manage your listings, watch their stats, and
          keep on top of incoming offers.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold">Your listings</h2>
            <p className="text-sm text-muted-foreground">
              {listings.length === 0
                ? "Nothing on sale yet."
                : `${listings.length} listing${listings.length === 1 ? "" : "s"} — edit, archive, or track views and favorites.`}
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