import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3Icon,
  FlagIcon,
  ListIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
  PackageOpenIcon,
} from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import {
  fetchMarketplaceStats,
} from "@/lib/admin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Admin",
  description: "Marketplace administration dashboard.",
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string
  value: number | string
  href: string
  icon: typeof UsersIcon
  accent?: string
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-1.5">
          <Icon className={`size-4 ${accent}`} />
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold text-foreground">
          {value}
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-primary hover:bg-transparent">
          <Link href={href}>Manage →</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default async function AdminDashboardPage() {
  const stats = await fetchMarketplaceStats()
  const reports = await fetchAdminReports()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Moderate listings and sellers, and monitor the health of the
          marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Users"
          value={stats.totalUsers}
          href="/admin/users"
          icon={UsersIcon}
        />
        <StatCard
          label="Listings"
          value={stats.totalListings}
          href="/admin/listings"
          icon={ListIcon}
        />
        <StatCard
          label="Active listings"
          value={stats.activeListings}
          href="/admin/listings"
          icon={PackageOpenIcon}
        />
        <StatCard
          label="Products sold"
          value={stats.productsSold}
          href="/admin/listings"
          icon={ShoppingBagIcon}
        />
        <StatCard
          label="Verified sellers"
          value={stats.verifiedSellers}
          href="/admin/users"
          icon={VerifiedIcon}
          accent="text-green-600"
        />
        <StatCard
          label="Open reports"
          value={stats.openReports}
          href="/admin/reports"
          icon={FlagIcon}
          accent="text-amber-600"
        />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlagIcon className="size-5 text-primary" />
              Moderation queue
              {reports.length > 0 ? (
                <Badge variant="secondary">{reports.length} open</Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              The oldest open reports, ready for your review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All caught up — there are no open reports right now.
              </p>
            ) : (
              <>
                <ul className="mb-4 flex flex-col gap-2">
                  {reports.slice(0, 5).map((report) => {
                    const target =
                      report.listing?.title ??
                      report.seller?.full_name ??
                      "A reported item"
                    return (
                      <li
                        key={report.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="truncate font-medium text-foreground">
                          {target}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {new Date(report.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </li>
                    )
                  })}
                </ul>
                <Button asChild variant="outline" size="sm">
                  <Link href="/admin/reports">Open the queue</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="size-5 text-primary" />
              Marketplace statistics
            </CardTitle>
            <CardDescription>
              A full breakdown of users, listings, and sales activity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/statistics">View statistics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
