import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3Icon,
  FlagIcon,
  ListIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
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

export default async function AdminDashboardPage() {
  const reports = await fetchAdminReports()

  const openCount = reports.length

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Admin dashboard
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Moderate listings and sellers, and keep an eye on what needs
          attention. Head to Statistics for the full marketplace numbers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ShieldAlertIcon className="size-4 text-amber-600" />
              Moderation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-heading text-3xl font-semibold text-foreground">
              {openCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Open reports awaiting your review
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-primary hover:bg-transparent">
              <Link href="/admin/reports">Review queue →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <UsersIcon className="size-4 text-primary" />
              Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Review accounts, verify sellers, and suspend offenders.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-primary hover:bg-transparent">
              <Link href="/admin/users">Manage users →</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <ListIcon className="size-4 text-primary" />
              Listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Inspect the catalog and remove policy-violating listings.
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2 px-0 text-primary hover:bg-transparent">
              <Link href="/admin/listings">Manage listings →</Link>
            </Button>
          </CardContent>
        </Card>
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3Icon className="size-5 text-primary" />
              Marketplace statistics
            </CardTitle>
            <CardDescription>
              Users, listings, sales, and verification numbers at a glance.
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
