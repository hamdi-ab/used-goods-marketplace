import type { Metadata } from "next"
import Link from "next/link"
import { FlagIcon, ImageIcon, UserIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/auth"
import { fetchMyReports, REPORT_REASON_LABELS, type MyReportRow } from "@/lib/reports"
import { formatShortDate, cn } from "@/lib/utils"
import { ReportStatusBadge } from "@/components/reports/report-status-badge"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { Button } from "@/components/ui/button"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My reports",
  description: "Reports you have submitted and their moderation status.",
}

const SUMMARY: {
  status: "open" | "resolved" | "rejected"
  label: string
}[] = [
  { status: "open", label: "Open" },
  { status: "resolved", label: "Resolved" },
  { status: "rejected", label: "Rejected" },
]

// Tinted backgrounds keyed by status so the summary strip is glanceable while
// the count itself stays `text-foreground` for a safe foreground-on-tint ratio.
const STATUS_TILE_BG: Record<(typeof SUMMARY)[number]["status"], string> = {
  open: "bg-amber-100",
  resolved: "bg-emerald-100",
  rejected: "bg-red-100",
}

function targetHref(row: MyReportRow, variant: VariantKey): string | null {
  if (row.target_type === "listing") {
    return withVariant(`/listings/${row.target_id}`, variant)
  }
  return withVariant(`/users/${row.target_id}`, variant)
}

// PROTOTYPE — reports redesign: the reporter's queue with a real status
// summary strip and target-type icons so open flags stand out. Fetch surfaces a
// real error so a DB blip shows a recovery action instead of a lying empty
// state (mirrors the notifications inbox). Signed-out reviewers see the empty
// state; signed-in reviewers get the full summary strip + target links.
export async function PrototypeReportsPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()
  const { reports, error } = user
    ? await fetchMyReports(user.id)
    : { reports: [], error: null }

  return (
    <>
      <PrototypeHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
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
                    ? "bg-[#2563EB]/10 text-[#1D4ED8]"
                    : "bg-muted text-foreground"
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

        {error ? (
          <div className="flex flex-col items-center rounded-2xl border border-border bg-muted/30 px-4 py-16 text-center">
            <FlagIcon className="mb-4 size-8 text-muted-foreground/70" />
            <h2 className="font-heading text-lg font-semibold">
              Couldn&apos;t load your reports
            </h2>
            <p className="mt-1 max-w-sm text-sm text-foreground/70">
              Something went wrong on our end. Please try again.
            </p>
            <Button asChild className="mt-4 h-11">
              <Link href={withVariant("/reports", variant)}>Try again</Link>
            </Button>
          </div>
        ) : reports.length === 0 ? (
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
              href={withVariant("/search", variant)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Browse listings
            </Link>
          </div>
        ) : (
          <>
            <ul
              className="mb-6 grid grid-cols-3 gap-3"
              aria-label="Report status summary"
            >
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
                const targetHref_ = targetHref(row, variant)
                const isListing = row.target_type === "listing"
                return (
                  <li
                    key={row.id}
                    className={cn(
                      "relative rounded-2xl border bg-card p-4 shadow-sm transition",
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
                        {targetHref_ ? (
                          <Link
                            href={targetHref_}
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
      <PrototypeFooter variant={variant} />
    </>
  )
}
