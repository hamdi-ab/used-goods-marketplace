"use client"

import Link from "next/link"
import {
  BarChart3Icon,
  CheckCircle2Icon,
  ChevronRightIcon,
  FlagIcon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  TrendingUpIcon,
  UsersIcon,
  VerifiedIcon,
} from "lucide-react"

import type { ReportWithRelations } from "@/lib/reports"
import type { MarketplaceStats as AdminStats } from "@/lib/admin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface VariantProps {
  stats: AdminStats
  reports: ReportWithRelations[]
  openCount: number
}

// ──────────────────────────────────────────────
// Variant A — Command Center
// KPIs in a top row, moderation queue as a dense table-like list
// ──────────────────────────────────────────────
export function VariantA({ stats, reports, openCount }: VariantProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Command Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketplace health and active moderation tasks.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {[
          { label: "Users", value: stats.totalUsers, icon: UsersIcon },
          { label: "Listings", value: stats.totalListings, icon: ListIcon },
          { label: "Active", value: stats.activeListings, icon: PackageOpenIcon },
          { label: "Sold", value: stats.productsSold, icon: ShoppingBagIcon },
          { label: "Verified", value: stats.verifiedSellers, icon: VerifiedIcon, accent: "text-emerald-600" },
          { label: "Reports", value: stats.openReports, icon: FlagIcon, accent: "text-amber-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted ${kpi.accent ?? "text-primary"}`}>
              <kpi.icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold leading-tight text-foreground">{kpi.value}</p>
              <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FlagIcon className="size-4 text-amber-600" />
              Moderation Queue
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
                return (
                  <div key={report.id} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <FlagIcon className="size-4 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{target}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.listing ? "Listing" : "Seller"} ·{" "}
                        {new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
    </div>
  )
}

// ──────────────────────────────────────────────
// Variant B — Card Focus
// Hero metrics with moderation queue as cards with thumbnails
// ──────────────────────────────────────────────
export function VariantB({ stats, reports, openCount }: VariantProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Marketplace health at a glance, with the moderation queue front and center.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total users", value: stats.totalUsers, icon: UsersIcon, hint: "Registered" },
          { label: "Listings", value: stats.totalListings, icon: ListIcon, hint: "All live" },
          { label: "Active", value: stats.activeListings, icon: PackageOpenIcon, hint: "Published" },
          { label: "Sold", value: stats.productsSold, icon: ShoppingBagIcon, hint: "Completed" },
          { label: "Verified", value: stats.verifiedSellers, icon: VerifiedIcon, hint: "Badged", accent: "text-emerald-600" },
          { label: "Open reports", value: stats.openReports, icon: FlagIcon, hint: "Action needed", accent: "text-amber-600" },
        ].map((kpi) => (
          <Card key={kpi.label} className="p-4">
            <div className="flex items-center gap-2">
              <kpi.icon className={`size-4 ${kpi.accent ?? "text-primary"}`} />
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
            </div>
            <p className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground">
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{kpi.hint}</p>
          </Card>
        ))}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold">Moderation queue</h2>
          {openCount > 0 ? (
            <Badge variant="secondary">{openCount} open</Badge>
          ) : null}
        </div>

        {openCount === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
              <CheckCircle2Icon className="size-12 text-emerald-500/50" />
              <p className="font-heading text-lg font-semibold">All caught up</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                There are no open reports to review right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reports.slice(0, 4).map((report) => {
              const target = report.listing?.title ?? report.seller?.full_name ?? "A reported item"
              return (
                <Card key={report.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                      <FlagIcon className="size-5 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">{target}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {report.listing ? "Listing" : "Seller"} ·{" "}
                        {new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-3">
                        <Link href="/admin/reports">
                          Review report
                          <ChevronRightIcon className="ml-1 size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Variant C — Sidebar Analytics
// Left column for KPIs/statistics, right column for moderation feed
// ──────────────────────────────────────────────
export function VariantC({ stats, reports, openCount }: VariantProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Key metrics and moderation feed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3Icon className="size-4 text-primary" />
                Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Total users", value: stats.totalUsers, icon: UsersIcon },
                { label: "Listings", value: stats.totalListings, icon: ListIcon },
                { label: "Active", value: stats.activeListings, icon: PackageOpenIcon },
                { label: "Sold", value: stats.productsSold, icon: ShoppingBagIcon },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="size-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VerifiedIcon className="size-3.5 text-emerald-600" />
                  <span className="text-sm text-muted-foreground">Verified</span>
                </div>
                <span className="text-sm font-semibold text-emerald-600">{stats.verifiedSellers}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FlagIcon className="size-3.5 text-amber-600" />
                  <span className="text-sm text-muted-foreground">Open reports</span>
                </div>
                <span className="text-sm font-semibold text-amber-600">{stats.openReports}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5">
            <CardContent className="flex items-center gap-3 py-5">
              <TrendingUpIcon className="size-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Health score</p>
                <p className="text-xs text-muted-foreground">Based on active listings vs. open reports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
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
              <CardDescription>The oldest open reports, ready for your review.</CardDescription>
            </CardHeader>
            <CardContent>
              {openCount === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <CheckCircle2Icon className="size-10 text-emerald-500/60" />
                  <p className="text-sm text-muted-foreground">All caught up.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {reports.slice(0, 8).map((report) => {
                    const target = report.listing?.title ?? report.seller?.full_name ?? "A reported item"
                    return (
                      <li key={report.id}>
                        <Link
                          href="/admin/reports"
                          className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                        >
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                            <FlagIcon className="size-3.5 text-amber-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">{target}</p>
                            <p className="text-xs text-muted-foreground">
                              {report.listing ? "Listing" : "Seller"} ·{" "}
                              {new Date(report.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
