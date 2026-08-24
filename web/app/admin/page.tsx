import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2Icon,
  FlagIcon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
} from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import { fetchMarketplaceStats } from "@/lib/admin"
import { BusinessLeadsWidget } from "@/components/admin/business-leads-widget"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Admin",
  description: "Marketplace administration dashboard.",
}

function KpiCard({
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
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`flex size-8 items-center justify-center rounded-lg bg-muted ${accent}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export default async function AdminDashboardPage() {
  const [stats, reports] = await Promise.all([
    fetchMarketplaceStats(),
    fetchAdminReports(),
  ])

  const openCount = reports.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketplace health and active moderation tasks.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Total users"
          value={stats.totalUsers}
          icon={UsersIcon}
          hint="Registered accounts"
        />
        <KpiCard
          label="Listings"
          value={stats.totalListings}
          icon={ListIcon}
          hint="All live listings"
        />
        <KpiCard
          label="Active"
          value={stats.activeListings}
          icon={PackageOpenIcon}
          hint="Published and visible"
        />
        <KpiCard
          label="Sold"
          value={stats.productsSold}
          icon={ShoppingBagIcon}
          hint="Completed sales"
        />
        <KpiCard
          label="Verified"
          value={stats.verifiedSellers}
          icon={VerifiedIcon}
          hint="Badged sellers"
          accent="text-emerald-600"
        />
        <KpiCard
          label="Open reports"
          value={stats.openReports}
          icon={FlagIcon}
          hint="Awaiting moderation"
          accent="text-amber-600"
        />
      </div>

      {/* Moderation Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlagIcon className="size-4 text-amber-600" />
              Moderation queue
            </CardTitle>
            {openCount > 0 ? (
              <Badge variant="secondary">{openCount} open</Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {openCount === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <CheckCircle2Icon className="size-10 text-emerald-500/60" />
              <p className="text-sm text-muted-foreground">All caught up.</p>
            </div>
          ) : (
            <div className="divide-y">
              {reports.slice(0, 6).map((report) => {
                const target = report.listing?.title ?? report.seller?.full_name ?? "A reported item"
                const isListing = report.listing != null
                return (
                  <div key={report.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <FlagIcon className="size-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{target}</p>
                      <p className="text-xs text-muted-foreground">
                        {isListing ? "Listing" : "Seller"} ·{" "}
                        {new Date(report.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button asChild variant="ghost" size="sm" className="shrink-0">
                      <Link href="/admin/reports">Review</Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Business Leads Widget (from main) */}
      <BusinessLeadsWidget />
    </div>
  )
}
