"use client"

import { useState } from "react"
import { useActionState } from "react"
import { ScaleIcon } from "lucide-react"

import { appealDisputeAction } from "@/app/actions/disputes"
import type { DisputeWithRelations } from "@/lib/disputes"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface AppealFormProps {
  dispute: DisputeWithRelations
}

export function AppealForm({ dispute }: AppealFormProps) {
  const [state, formAction, pending] = useActionState(appealDisputeAction, {})
  const [appealNote, setAppealNote] = useState("")

  // Only show appeal form if dispute is resolved (not closed, not appealed, not open)
  const canAppeal = dispute.status === "resolved_buyer" || dispute.status === "resolved_seller"

  if (!canAppeal) {
    return null
  }

  if (state.ok) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
        <p className="font-medium">Appeal submitted</p>
        <p className="mt-1">Our team will review your appeal within 7 days.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-purple-200 bg-purple-50 p-3">
      <input type="hidden" name="disputeId" value={dispute.id} />
      <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
        <ScaleIcon className="size-4" />
        Appeal this decision
      </div>

      <div>
        <Label htmlFor={`appeal-${dispute.id}`} className="text-xs">
          Reason for appeal
        </Label>
        <Textarea
          id={`appeal-${dispute.id}`}
          name="appealNote"
          value={appealNote}
          onChange={(e) => setAppealNote(e.target.value)}
          placeholder="Explain why you disagree with this decision..."
          rows={3}
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        size="sm"
        disabled={!appealNote.trim() || pending}
      >
        {pending ? "Submitting..." : "Submit appeal"}
      </Button>

      {state.message ? (
        <p role="alert" className="text-xs text-destructive">{state.message}</p>
      ) : null}
    </form>
  )
}
