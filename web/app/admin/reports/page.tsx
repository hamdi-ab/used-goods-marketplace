import type { Metadata } from "next"
import Link from "next/link"
import { ShieldCheckIcon, MessageSquareWarningIcon } from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import { fetchAdminReviewAppeals } from "@/lib/appeals"
import { AdminReportCard } from "@/components/reports/admin-report-card"
import { AdminAppealCard } from "@/components/admin/admin-appeal-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Reports & Moderation",
  description: "Moderation queue for reported listings, sellers, reviews, and appeals.",
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>
}) {
  const { tab = "reports" } = (await searchParams) ?? {}
  const [reports, appeals] = await Promise.all([
    fetchAdminReports(),
    fetchAdminReviewAppeals(),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Moderation queue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review reports and resolve them. Block sellers, remove listings, remove review violations, or resolve appeals.
        </p>
      </div>

      <nav className="mb-6 flex items-center gap-2 border-b pb-3" aria-label="Moderation queue sections">
        <Link
          href="/admin/reports?tab=reports"
          aria-current={tab === "reports" ? "page" : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[36px] ${
            tab === "reports"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Reports
          {reports.length > 0 ? (
            <Badge
              variant={tab === "reports" ? "secondary" : "default"}
              className="ml-1 px-1.5 py-0 text-xs"
            >
              {reports.length}
            </Badge>
          ) : null}
        </Link>
        <Link
          href="/admin/reports?tab=appeals"
          aria-current={tab === "appeals" ? "page" : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[36px] ${
            tab === "appeals"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          }`}
        >
          Review Appeals
          {appeals.length > 0 ? (
            <Badge
              variant={tab === "appeals" ? "secondary" : "default"}
              className="ml-1 px-1.5 py-0 text-xs"
            >
              {appeals.length}
            </Badge>
          ) : null}
        </Link>
      </nav>

      {tab === "appeals" ? (
        appeals.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <EmptyState
                icon={MessageSquareWarningIcon}
                title="No pending appeals"
                description="Appeals submitted by reviewers for removed reviews will appear here."
              />
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {appeals.map((appeal) => (
              <li key={appeal.id}>
                <AdminAppealCard appeal={appeal} />
              </li>
            ))}
          </ul>
        )
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={ShieldCheckIcon}
              title="All caught up"
              description="There are no open reports to review right now."
            />
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((report) => (
            <li key={report.id}>
              <AdminReportCard report={report} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
