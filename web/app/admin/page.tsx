import type { Metadata } from "next"
import Link from "next/link"
import {
  FlagIcon,
  ListIcon,
  PackageOpenIcon,
  ShoppingBagIcon,
  UsersIcon,
  VerifiedIcon,
} from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import { fetchMarketplaceStats } from "@/lib/admin"
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

function Kpi({
  label,
  value,
  icon: Icon,
  accent = "text-primary",
}: {
  label: string
  value: number
  icon: typeof UsersIcon
  accent?: string
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-border bg-background p-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
          {value}
        </p>
      </div>
      <Icon className={`size-5 shrink-0 ${accent}`} />
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
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Marketplace health at a glance, with the moderation queue front and
          center. Dive into the numbers on Statistics.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Total users" value={stats.totalUsers} icon={UsersIcon} />
        <Kpi label="Listings" value={stats.totalListings} icon={ListIcon} />
        <Kpi label="Active" value={stats.activeListings} icon={PackageOpenIcon} />
        <Kpi label="Sold" value={stats.productsSold} icon={ShoppingBagIcon} />
        <Kpi label="Verified" value={stats.verifiedSellers} icon={VerifiedIcon} accent="text-green-600" />
        <Kpi label="Open reports" value={stats.openReports} icon={FlagIcon} accent="text-amber-600" />
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlagIcon className="size-5 text-primary" />
              Moderation queue
              {openCount > 0 ? (
                <Badge variant="secondary">{openCount} open</Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              The oldest open reports, ready for your review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {openCount === 0 ? (
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
    </div>
  )
}
