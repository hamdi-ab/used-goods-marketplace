import type { Metadata } from "next"
import Link from "next/link"
import { ShieldIcon, MessageSquareWarningIcon } from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import { fetchAdminReviewAppeals } from "@/lib/appeals"
import { AdminReportCard } from "@/components/reports/admin-report-card"
import { AdminAppealCard } from "@/components/admin/admin-appeal-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

      <div className="mb-6 flex items-center gap-2 border-b pb-3">
        <Link
          href="/admin/reports?tab=reports"
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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
      </div>

      {tab === "appeals" ? (
        appeals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <MessageSquareWarningIcon className="size-8 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">
                No pending appeals
              </h2>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                Appeals submitted by reviewers for removed reviews will appear here.
              </p>
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
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShieldIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              All caught up
            </h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              There are no open reports to review right now.
            </p>
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
