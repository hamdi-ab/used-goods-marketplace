"use client"

import type { MarketplaceStats, StatsBreakdown } from "@/lib/admin"
import {
  BarChart3Icon,
  FlagIcon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface StatsProps {
  stats: MarketplaceStats
  breakdown: StatsBreakdown
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
      <CardContent className="flex flex-col gap-3 py-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className={`flex size-9 items-center justify-center rounded-lg bg-muted ${accent}`}>
            <Icon className="size-4" />
          </span>
        </div>
        <p className="font-heading text-3xl font-semibold tracking-tight text-foreground">{value}</p>
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
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
        {count}
      </span>
    </li>
  )
}

// ──────────────────────────────────────────────
// Variant A — Standard (current design)
// Stat tiles + 3 breakdown cards + about section
// ──────────────────────────────────────────────
export function StatisticsVariantA({ stats, breakdown }: StatsProps) {
  const listingTotal = Object.values(breakdown.byStatus).reduce((a, b) => a + b, 0)
  const userTotal = Object.values(breakdown.byRole).reduce((a, b) => a + b, 0)
  const reportTotal = Object.values(breakdown.byReportStatus).reduce((a, b) => a + b, 0)

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
        <StatTile label="Total users" value={stats.totalUsers} icon={UsersIcon} hint="Registered accounts" />
        <StatTile label="Total listings" value={stats.totalListings} icon={ListIcon} hint="All live listings" />
        <StatTile label="Active listings" value={stats.activeListings} icon={PackageOpenIcon} hint="Published and visible" />
        <StatTile label="Products sold" value={stats.productsSold} icon={ShoppingBagIcon} hint="Listings with a completed sale" />
        <StatTile label="Verified sellers" value={stats.verifiedSellers} icon={VerifiedIcon} accent="text-emerald-600" hint="Sellers with a phone or Fayda verification" />
        <StatTile label="Open reports" value={stats.openReports} icon={FlagIcon} accent="text-amber-600" hint="Awaiting moderation" />
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
                  <BreakdownRow key={status} label={status} count={count} total={listingTotal} />
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
                  <BreakdownRow key={role} label={role} count={count} total={userTotal} />
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
                {Object.entries(breakdown.byReportStatus).map(([status, count]) => (
                  <BreakdownRow key={status} label={status} count={count} total={reportTotal} />
                ))}
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

// ──────────────────────────────────────────────
// Variant B — Hero + Donut
// Large hero metrics with donut-style breakdowns
// ──────────────────────────────────────────────
export function StatisticsVariantB({ stats, breakdown }: StatsProps) {
  const listingTotal = Object.values(breakdown.byStatus).reduce((a, b) => a + b, 0)
  const userTotal = Object.values(breakdown.byRole).reduce((a, b) => a + b, 0)
  const reportTotal = Object.values(breakdown.byReportStatus).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Statistics
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Marketplace composition at a glance.
        </p>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Users" value={stats.totalUsers} icon={UsersIcon} />
        <StatTile label="Listings" value={stats.totalListings} icon={ListIcon} />
        <StatTile label="Active" value={stats.activeListings} icon={PackageOpenIcon} />
        <StatTile label="Sold" value={stats.productsSold} icon={ShoppingBagIcon} />
        <StatTile label="Verified" value={stats.verifiedSellers} icon={VerifiedIcon} accent="text-emerald-600" />
        <StatTile label="Reports" value={stats.openReports} icon={FlagIcon} accent="text-amber-600" />
      </div>

      {/* Breakdown cards with visual bars */}
      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Listings by status</CardTitle>
            <CardDescription className="text-xs">{listingTotal} total listings</CardDescription>
          </CardHeader>
          <CardContent>
            {listingTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No listings yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {Object.entries(breakdown.byStatus).map(([status, count]) => (
                  <BreakdownRow key={status} label={status} count={count} total={listingTotal} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Users by role</CardTitle>
            <CardDescription className="text-xs">{userTotal} total users</CardDescription>
          </CardHeader>
          <CardContent>
            {userTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {Object.entries(breakdown.byRole).map(([role, count]) => (
                  <BreakdownRow key={role} label={role} count={count} total={userTotal} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reports by status</CardTitle>
            <CardDescription className="text-xs">{reportTotal} total reports</CardDescription>
          </CardHeader>
          <CardContent>
            {reportTotal === 0 ? (
              <p className="text-sm text-muted-foreground">No reports yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {Object.entries(breakdown.byReportStatus).map(([status, count]) => (
                  <BreakdownRow key={status} label={status} count={count} total={reportTotal} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Variant C — Compact Table
// All data in a single table with inline bars
// ──────────────────────────────────────────────
export function StatisticsVariantC({ stats, breakdown }: StatsProps) {
  const listingTotal = Object.values(breakdown.byStatus).reduce((a, b) => a + b, 0)
  const userTotal = Object.values(breakdown.byRole).reduce((a, b) => a + b, 0)
  const reportTotal = Object.values(breakdown.byReportStatus).reduce((a, b) => a + b, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Statistics
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          All marketplace metrics in one view.
        </p>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {[
          { label: "Users", value: stats.totalUsers, icon: UsersIcon },
          { label: "Listings", value: stats.totalListings, icon: ListIcon },
          { label: "Active", value: stats.activeListings, icon: PackageOpenIcon },
          { label: "Sold", value: stats.productsSold, icon: ShoppingBagIcon },
          { label: "Verified", value: stats.verifiedSellers, icon: VerifiedIcon, accent: "text-emerald-600" },
          { label: "Reports", value: stats.openReports, icon: FlagIcon, accent: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-1.5">
              <kpi.icon className={`size-3.5 ${kpi.accent ?? "text-primary"}`} />
              <span className="text-[0.65rem] font-medium text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="mt-1 font-heading text-xl font-semibold tracking-tight text-foreground">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Single table with all breakdowns */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3Icon className="size-4 text-primary" />
            Breakdowns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Listings */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Listings by status
              </h4>
              {listingTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No listings yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {Object.entries(breakdown.byStatus).map(([status, count]) => (
                    <BreakdownRow key={status} label={status} count={count} total={listingTotal} />
                  ))}
                </ul>
              )}
            </div>

            {/* Users */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Users by role
              </h4>
              {userTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No users yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {Object.entries(breakdown.byRole).map(([role, count]) => (
                    <BreakdownRow key={role} label={role} count={count} total={userTotal} />
                  ))}
                </ul>
              )}
            </div>

            {/* Reports */}
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Reports by status
              </h4>
              {reportTotal === 0 ? (
                <p className="text-sm text-muted-foreground">No reports yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {Object.entries(breakdown.byReportStatus).map(([status, count]) => (
                    <BreakdownRow key={status} label={status} count={count} total={reportTotal} />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
