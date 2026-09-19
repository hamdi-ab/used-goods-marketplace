import type { Metadata } from "next"
import { Suspense } from "react"

import { requireTrader } from "@/lib/auth"
import { ActivityTabs } from "@/components/activity/activity-tabs"
import { OffersList } from "@/components/activity/offers-list"
import { FavoritesList } from "@/components/activity/favorites-list"
import { DashboardView } from "@/components/activity/dashboard-view"
import { ListingsList } from "@/components/activity/listings-list"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Activity",
  description: "Your buying and selling activity on Dagim Gebeya.",
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = "offers" } = await searchParams
  const user = await requireTrader()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold mb-6">Activity</h1>
      <Suspense fallback={<div className="h-10 animate-pulse bg-muted rounded" />}>
        <ActivityTabs />
      </Suspense>
      <Suspense fallback={<div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse bg-muted rounded" />)}</div>}>
        {tab === "offers" && <OffersList userId={user.id} />}
        {tab === "favorites" && <FavoritesList userId={user.id} />}
        {tab === "dashboard" && <DashboardView userId={user.id} />}
        {tab === "listings" && <ListingsList userId={user.id} />}
      </Suspense>
    </div>
  )
}
