"use client"

import { useActionState } from "react"
import { CheckCircleIcon } from "lucide-react"

import { submitReport } from "@/app/actions/reports"
import type { SubmitReportState } from "@/app/actions/reports"
import {
  REPORT_REASONS,
  REPORT_REASON_LABELS,
  REPORT_NOTE_MAX,
} from "@/lib/reports/constants"
import { Button } from "@/components/ui/button"
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

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

  // T11 AC4: show a "report received" acknowledgement instead of silently
  // closing — the reporter must see that their report was accepted.
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
          <Button type="button" size="sm" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Report item</DialogTitle>
        <DialogDescription>
          Let us know why this item or seller should be reviewed. A moderator
          will look at your report shortly.
        </DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        <input type="hidden" name="listingId" value={listingId ?? ""} />
        <input type="hidden" name="sellerId" value={sellerId ?? ""} />

        <div className="mt-4 flex flex-col gap-3">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium">Reason</legend>
            {REPORT_REASONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 text-sm"
              >
                <input type="radio" name="reason" value={r} required />
                <span>{REPORT_REASON_LABELS[r]}</span>
              </label>
            ))}
          </fieldset>
          <FieldError message={state.errors?.reason?.[0]} />

          <div className="flex flex-col gap-2">
            <label htmlFor="report-note" className="text-sm font-medium">
              Details (optional)
            </label>
            <textarea
              id="report-note"
              name="note"
              rows={3}
              maxLength={REPORT_NOTE_MAX}
              placeholder="Add any details that will help the moderator."
              className="resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring/50"
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
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
