import type { Metadata } from "next"
import {
  BarChart3Icon,
  FlagIcon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
} from "lucide-react"

import { fetchMarketplaceStats, fetchStatsBreakdown } from "@/lib/admin"
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

function BreakdownRow({
  label,
  count,
  total,
}: {
  label: string
  count: number
  total: number
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <li className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary/70"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {count}
      </span>
    </li>
  )
}

export default async function AdminStatisticsPage() {
  const [stats, breakdown] = await Promise.all([
    fetchMarketplaceStats(),
    fetchStatsBreakdown(),
  ])

  const listingTotal = Object.values(breakdown.byStatus).reduce((a, b) => a + b, 0)
  const userTotal = Object.values(breakdown.byRole).reduce((a, b) => a + b, 0)
  const reportTotal = Object.values(breakdown.byReportStatus).reduce(
    (a, b) => a + b,
    0
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Statistics
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Marketplace metrics and their composition — the deeper breakdown
          behind the dashboard&apos;s headline numbers.
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

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Listings by status</CardTitle>
            <CardDescription>How the catalog is split.</CardDescription>
          </CardHeader>
          <CardContent>
            {listingTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {Object.entries(breakdown.byStatus).map(([status, count]) => (
                  <BreakdownRow
                    key={status}
                    label={status}
                    count={count}
                    total={listingTotal}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Users by role</CardTitle>
            <CardDescription>Account composition.</CardDescription>
          </CardHeader>
          <CardContent>
            {userTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {Object.entries(breakdown.byRole).map(([role, count]) => (
                  <BreakdownRow
                    key={role}
                    label={role}
                    count={count}
                    total={userTotal}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Reports by status</CardTitle>
            <CardDescription>Moderation workload.</CardDescription>
          </CardHeader>
          <CardContent>
            {reportTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {Object.entries(breakdown.byReportStatus).map(
                  ([status, count]) => (
                    <BreakdownRow
                      key={status}
                      label={status}
                      count={count}
                      total={reportTotal}
                    />
                  )
                )}
              </ul>
            )}
          </CardContent>
        </Card>
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
