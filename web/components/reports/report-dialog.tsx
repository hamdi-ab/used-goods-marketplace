"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  CopyIcon,
  FlagIcon,
  FolderTreeIcon,
  MailWarningIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { submitReport } from "@/app/actions/reports"
import type { SubmitReportState } from "@/app/actions/reports"
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  REPORT_NOTE_MAX,
  type ReportReason,
} from "@/lib/reports/constants"
import { TEXTAREA_CLASS } from "@/lib/form-fields"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const REASON_ICONS: Record<ReportReason, LucideIcon> = {
  spam: MailWarningIcon,
  fraud: ShieldAlertIcon,
  duplicate: CopyIcon,
  wrong_category: FolderTreeIcon,
  offensive_content: AlertTriangleIcon,
  other: MessageSquareIcon,
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function ReportDialog({
  listingId,
  sellerId,
  onClose,
}: {
  listingId: string | null
  sellerId: string | null
  onClose: () => void
}) {
  const [state, formAction, pending] = useActionState<
    SubmitReportState,
    FormData
  >(submitReport, {})
  const [selectedReason, setSelectedReason] = useState<string>("")

  // T11 AC4: show a "report received" acknowledgement instead of silently
  // closing — the reporter must see that their report was accepted, and can
  // follow through to /reports to track its status (#80).
  if (state.ok) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Report received</DialogTitle>
          <DialogDescription>
            A moderator will review your report and take action if needed.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex items-start gap-3">
          <CheckCircleIcon className="mt-0.5 size-5 text-green-500" />
          <p className="text-sm text-muted-foreground">
            Thank you for helping keep the marketplace safe.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" size="sm" asChild>
            <Link href="/reports">View your reports</Link>
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </>
    )
  }

  const reasons = REPORT_REASONS
  const targetLabel = sellerId ? "seller" : "item"

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FlagIcon className="size-5 text-destructive" />
          Report {targetLabel}
        </DialogTitle>
        <DialogDescription>
          Let us know why this {targetLabel} should be reviewed. A moderator
          will look at your report shortly.
        </DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        <input type="hidden" name="listingId" value={listingId ?? ""} />
        <input type="hidden" name="sellerId" value={sellerId ?? ""} />

        <div className="mt-4 flex flex-col gap-3">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="sr-only">Reason</legend>
            <p className="text-sm font-medium" id="reason-label">
              Why are you reporting this {targetLabel}?
            </p>
            {reasons.map((r) => {
              const Icon = REASON_ICONS[r]
              const label = REPORT_REASON_LABELS[r]
              return (
                <label
                  key={r}
                  htmlFor={`report-reason-${r}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    selectedReason === r
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-input bg-background text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    id={`report-reason-${r}`}
                    name="reason"
                    value={r}
                    required
                    checked={selectedReason === r}
                    onChange={() => setSelectedReason(r)}
                    className="sr-only"
                  />
                  <Icon className="size-4 shrink-0" />
                  <span>{label}</span>
                </label>
              )
            })}
            <FieldError message={state.errors?.reason?.[0]} />
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="report-note" className="text-sm font-medium">
              Details{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>
            <textarea
              id="report-note"
              name="note"
              rows={3}
              maxLength={REPORT_NOTE_MAX}
              placeholder="Add any details that will help the moderator."
              className={TEXTAREA_CLASS}
            />
            <FieldError message={state.errors?.note?.[0]} />
          </div>

          {state.message ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={pending || !selectedReason}>
            {pending ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
