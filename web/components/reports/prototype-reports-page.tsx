import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"
import { FlagIcon, ImageIcon, UserIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyReports } from "@/lib/reports"
import { REPORT_REASON_LABELS } from "@/lib/reports"
import type { MyReportRow } from "@/lib/reports"
import type { ReportStatus } from "@/lib/reports"
import { formatShortDate, cn } from "@/lib/utils"
import { ReportStatusBadge } from "@/components/reports/report-status-badge"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My reports",
  description: "Reports you have submitted and their moderation status.",
}

const SUMMARY: { status: ReportStatus; label: string; tile: string }[] = [
  { status: "open", label: "Open", tile: "bg-amber-100 text-amber-800" },
  { status: "resolved", label: "Resolved", tile: "bg-emerald-100 text-emerald-700" },
  { status: "rejected", label: "Rejected", tile: "bg-red-100 text-red-700" },
]

// PROTOTYPE — reports redesign: the reporter's queue with a real status
// summary strip and target-type icons so open flags stand out. View-only
// during review: signed-out reviewers see the empty state.
export async function PrototypeReportsPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const reports = user ? await fetchMyReports(user.id) : []

  const summary = (row: MyReportRow): ReactNode => {
    const isListing = row.target_type === "listing"
    return (
      <li
        key={row.id}
        className={cn(
          "relative rounded-2xl border bg-card p-4 shadow-sm",
          row.status === "open" &&
            (variant === "B"
              ? "border-[#2563EB]/40 bg-[#EEF4FF]/60"
              : "border-amber-300/60 bg-amber-50/50")
        )}
      >
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-full",
              isListing
                ? "bg-[#2563EB]/10 text-[#2563EB]"
                : "bg-violet-100 text-violet-700"
            )}
          >
            {isListing ? (
              <ImageIcon className="size-5" />
            ) : (
              <UserIcon className="size-5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">
              {row.target_type === "listing"
                ? `Listing: ${row.target_title ?? "Untitled"}`
                : `Seller: ${row.target_title ?? "Anonymous"}`}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {REPORT_REASON_LABELS[row.reason]}
              {row.note ? (
                <span className="ml-1.5 text-xs text-muted-foreground/80">
                  — {row.note}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submitted {formatShortDate(row.created_at)}
            </p>
          </div>
          <ReportStatusBadge status={row.status} />
        </div>
      </li>
    )
  }

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              My reports
            </h1>
            {reports.length > 0 ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold",
                  variant === "B"
                    ? "bg-[#2563EB]/10 text-[#2563EB]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {reports.filter((r) => r.status === "open").length} open
              </span>
            ) : null}
          </div>
          <Link
            href={withVariant("/favorites", variant)}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            ← Back to favorites
          </Link>
        </div>

        {reports.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center rounded-2xl border px-4 py-20 text-center",
              variant === "B"
                ? "border-[#2563EB]/30 bg-[#EEF4FF]"
                : "border-border bg-muted/30"
            )}
          >
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
              <FlagIcon className="size-6 text-muted-foreground/70" />
            </div>
            <h2 className="font-heading text-lg font-semibold">
              No reports yet
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Use the Report button on a listing or seller profile to flag
              content that violates the community guidelines.
            </p>
            <Link
              href={withVariant("/browse", variant)}
              className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-3 gap-3">
              {SUMMARY.map((s) => {
                const count = reports.filter((r) => r.status === s.status).length
                return (
                  <div
                    key={s.status}
                    className={cn(
                      "rounded-2xl border border-border bg-card px-4 py-3 shadow-sm",
                      variant === "B" && s.status === "open" && "border-[#2563EB]/30"
                    )}
                  >
                    <p className={cn("text-2xl font-extrabold", s.tile, "rounded-full px-2 py-0.5 text-sm")}>
                      {count}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted-foreground">
                      {s.label}
                    </p>
                  </div>
                )
              })}
            </div>

            <ul className="flex flex-col gap-3">{reports.map(summary)}</ul>
          </>
        )}
      </main>
      <PrototypeFooter variant={variant} />
    </>
  )
}