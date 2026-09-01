"use client"

import { useState } from "react"
import { useActionState } from "react"
import { AlertTriangleIcon } from "lucide-react"

import { openDisputeAction } from "@/app/actions/disputes"
import type { DisputeReason } from "@/lib/disputes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface DisputeFormProps {
  paymentId: string
}

const REASON_LABELS: Record<DisputeReason, string> = {
  not_received: "Item not received",
  not_as_description: "Not as described",
  damaged: "Item damaged",
  other: "Other issue",
}

export function DisputeForm({ paymentId }: DisputeFormProps) {
  const [state, formAction, pending] = useActionState(openDisputeAction, {})
  const [reason, setReason] = useState<DisputeReason | null>(null)
  const [description, setDescription] = useState("")

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <p className="font-medium">Dispute submitted</p>
        <p className="mt-1">Our team will review it within 7 days.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
      <input type="hidden" name="paymentId" value={paymentId} />
      <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
        <AlertTriangleIcon className="size-4" />
        Open a dispute
      </div>

      <div>
        <Label className="text-xs">Reason</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(Object.keys(REASON_LABELS) as DisputeReason[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-lg border px-2 py-1 text-xs transition ${
                reason === r
                  ? "border-amber-500 bg-amber-100 text-amber-800"
                  : "border-amber-200 bg-white text-amber-700 hover:bg-amber-50"
              }`}
            >
              {REASON_LABELS[r]}
            </button>
          ))}
        </div>
        <input type="hidden" name="reason" value={reason ?? ""} />
      </div>

      <div>
        <Label htmlFor={`desc-${paymentId}`} className="text-xs">Description</Label>
        <Textarea
          id={`desc-${paymentId}`}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue..."
          rows={2}
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!reason || !description.trim() || pending}
      >
        {pending ? "Submitting..." : "Submit dispute"}
      </Button>

      {state.message ? (
        <p role="alert" className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  )
}
