import type { Metadata } from "next"
import {
  BarChart3Icon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
  FlagIcon,
} from "lucide-react"

import { fetchMarketplaceStats } from "@/lib/admin"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Admin — Statistics",
  description: "Marketplace statistics and trends.",
}

function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  accent = "text-primary",
}: {
  label: string
  value: number
  icon: typeof UsersIcon
  hint?: string
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 py-6">
        <div className={`flex items-center gap-2 ${accent}`}>
          <Icon className="size-5" />
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <p className="font-heading text-4xl font-semibold text-foreground">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}

export default async function AdminStatisticsPage() {
  const stats = await fetchMarketplaceStats()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Statistics
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          A snapshot of marketplace activity, matching the Administration module
          of the product requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          label="Total users"
          value={stats.totalUsers}
          icon={UsersIcon}
          hint="Registered accounts"
        />
        <StatTile
          label="Total listings"
          value={stats.totalListings}
          icon={ListIcon}
          hint="All live listings"
        />
        <StatTile
          label="Active listings"
          value={stats.activeListings}
          icon={PackageOpenIcon}
          hint="Published and visible"
        />
        <StatTile
          label="Products sold"
          value={stats.productsSold}
          icon={ShoppingBagIcon}
          hint="Listings with a completed sale"
        />
        <StatTile
          label="Verified sellers"
          value={stats.verifiedSellers}
          icon={VerifiedIcon}
          accent="text-green-600"
          hint="Sellers with a phone or Fayda verification"
        />
        <StatTile
          label="Open reports"
          value={stats.openReports}
          icon={FlagIcon}
          accent="text-amber-600"
          hint="Awaiting moderation"
        />
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3Icon className="size-5 text-primary" />
            About these numbers
          </CardTitle>
          <CardDescription>
            Counts are computed live against the current database. Sold listings
            are those stamped by an accepted offer; verified sellers are sellers
            who hold a phone or Fayda verification badge.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
