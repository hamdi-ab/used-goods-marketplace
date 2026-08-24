import type { Metadata } from "next"
import Link from "next/link"
import { FlagIcon, ImageIcon, UserIcon } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchMyReports, REPORT_REASON_LABELS, type MyReportRow, type ReportStatus } from "@/lib/reports"
import { formatShortDate, cn } from "@/lib/utils"
import { ReportStatusBadge } from "@/components/reports/report-status-badge"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My reports",
  description: "Reports you have submitted and their moderation status.",
}

const SUMMARY: {
  status: ReportStatus
  label: string
}[] = [
  { status: "open", label: "Open" },
  { status: "resolved", label: "Resolved" },
  { status: "rejected", label: "Rejected" },
]

const STATUS_TILE_BG: Record<ReportStatus, string> = {
  open: "bg-amber-100",
  resolved: "bg-emerald-100",
  rejected: "bg-red-100",
}

function targetHref(row: MyReportRow): string | null {
  if (row.target_type === "listing") {
    return `/listings/${row.target_id}`
  }
  return `/users/${row.target_id}`
}

export default async function MyReportsPage() {
  const user = await requireUser()
  const { reports, error } = await fetchMyReports(user.id)

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            My reports
          </h1>
          {reports.length > 0 ? (
            <span className="rounded-full bg-[#2563EB]/10 px-2.5 py-1 text-xs font-semibold text-[#1D4ED8]">
              {reports.filter((r) => r.status === "open").length} open
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] px-4 py-16 text-center">
          <FlagIcon className="mb-4 size-8 text-[#2563EB]" />
          <h2 className="font-heading text-lg font-semibold">
            Couldn&apos;t load your reports
          </h2>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Something went wrong on our end. Please try again.
          </p>
          <Link
            href="/reports"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            Try again
          </Link>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] px-4 py-16 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-white">
            <FlagIcon className="size-6 text-[#2563EB]" />
          </div>
          <h2 className="font-heading text-lg font-semibold">
            No reports yet
          </h2>
          <p className="mt-1 max-w-sm text-sm text-foreground/70">
            Use the Report button on a listing or seller profile to flag content
            that violates the community guidelines.
          </p>
          <Link
            href="/search"
            className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#2563EB] px-4 text-sm font-medium text-white hover:bg-[#1D4ED8]"
          >
            Browse listings
          </Link>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <ul className="mb-6 grid grid-cols-3 gap-3">
            {SUMMARY.map((s) => {
              const count = reports.filter((r) => r.status === s.status).length
              return (
                <li
                  key={s.status}
                  className={cn(
                    "rounded-2xl border border-border px-4 py-3 text-center shadow-sm",
                    STATUS_TILE_BG[s.status]
                  )}
                >
                  <p className="text-2xl font-extrabold text-foreground">
                    {count}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-muted-foreground">
                    {s.label}
                  </p>
                </li>
              )
            })}
          </ul>

          <ul className="flex flex-col gap-3">
            {reports.map((row) => {
              const href = targetHref(row)
              const isListing = row.target_type === "listing"
              return (
                <li
                  key={row.id}
                  className={cn(
                    "relative rounded-2xl border bg-card p-4 shadow-sm transition",
                    row.status === "open"
                      ? "border-[#2563EB]/40 bg-[#EEF4FF]/60"
                      : "border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        isListing
                          ? "bg-[#2563EB]/10 text-[#2563EB]"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {isListing ? (
                        <ImageIcon className="size-5" />
                      ) : (
                        <UserIcon className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "truncate text-sm",
                          row.status === "open"
                            ? "font-semibold text-foreground"
                            : "font-medium text-foreground"
                        )}
                      >
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
                    <div className="flex shrink-0 items-center gap-2">
                      {href ? (
                        <Link
                          href={href}
                          className="inline-flex h-9 min-w-16 items-center justify-center rounded-lg px-3 text-sm font-medium text-[#2563EB] hover:bg-[#2563EB]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/60"
                        >
                          View
                        </Link>
                      ) : null}
                      <ReportStatusBadge status={row.status} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </main>
  )
}
