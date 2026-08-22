import type { Metadata } from "next"
import Link from "next/link"

import { requireUser } from "@/lib/auth"
import { fetchMyReports } from "@/lib/reports"
import {
  REPORT_REASON_LABELS,
  type ReportStatus,
} from "@/lib/reports"
import { formatShortDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ReportStatusBadge } from "@/components/reports/report-status-badge"
import { PrototypeReportsPage } from "@/components/reports/prototype-reports-page"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My reports",
  description: "Reports you have submitted and their moderation status.",
}

// Count of reports still awaiting moderation; shown as a lightweight summary
// so a reporter can see at a glance whether anything is still open (P1.13, #80).
function openCount(reports: { status: ReportStatus }[]): number {
  return reports.filter((r) => r.status === "open").length
}

export default async function MyReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ variant?: string }>
}) {
  const { variant } = await searchParams
  const key = variant === "A" || variant === "B" ? (variant as "A" | "B") : null

  // PROTOTYPE — the redesign variant is view-only during review and bypasses
  // the auth redirect (see proxy.ts) so ?variant=A|B renders without a session.
  if (key) {
    return <PrototypeReportsPage variant={key} />
  }

  const user = await requireUser()
  const { reports } = await fetchMyReports(user.id)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          My reports
        </h1>
        <Badge variant="outline" className="text-xs">
          {openCount(reports)} open
        </Badge>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-10 pb-8 text-center">
            <p className="text-sm text-muted-foreground">
              You haven&apos;t submitted any reports yet.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the Report button on a listing or seller profile to flag
              content that violates the community guidelines.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {reports.map((report) => (
            <li key={report.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {report.target_type === "listing"
                          ? `Listing: ${report.target_title ?? "Untitled"}`
                          : `Seller: ${report.target_title ?? "Anonymous"}`}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {REPORT_REASON_LABELS[report.reason]}
                        {report.note ? (
                          <span className="ml-1.5 text-xs text-muted-foreground/80">
                            — {report.note}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Submitted {formatShortDate(report.created_at)}
                      </p>
                    </div>
                    <ReportStatusBadge status={report.status} />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Separator className="my-6" />
      <div className="text-center">
        <Link href="/favorites" className="text-sm font-medium underline">
          ← Back to favorites
        </Link>
      </div>
    </main>
  )
}
