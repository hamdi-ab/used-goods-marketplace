"use client"

import { useState } from "react"
import { useActionState } from "react"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
} from "lucide-react"

import type { DisputeWithRelations, DisputeResolution } from "@/lib/disputes"
import { decideDisputeAction } from "@/app/actions/disputes"
import { formatPrice } from "@/lib/listings/constants"
import { formatShortDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface AdminDisputeCardProps {
  dispute: DisputeWithRelations
}

const RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  refund_buyer: "Refund buyer",
  pay_seller: "Pay seller",
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  appealed: "bg-purple-100 text-purple-800",
}

export function AdminDisputeCard({ dispute }: AdminDisputeCardProps) {
  const [state, formAction, pending] = useActionState(decideDisputeAction, {})
  const [selectedResolution, setSelectedResolution] = useState<DisputeResolution | null>(null)
  const [adminNote, setAdminNote] = useState("")

  const createdDate = formatShortDate(dispute.created_at)
  const daysOpen = Math.floor((Date.now() - new Date(dispute.created_at).getTime()) / (1000 * 60 * 60 * 24))
  const isOverdue = daysOpen > 7

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100">
              <AlertTriangleIcon className="size-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{dispute.reason.replace(/_/g, " ")}</span>
                <Badge className={STATUS_STYLES[dispute.status] ?? "bg-gray-100 text-gray-800"}>
                  {dispute.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Opened {createdDate} by {dispute.opener?.full_name ?? "Unknown"}
                {isOverdue ? (
                  <span className="ml-2 text-red-600">({daysOpen} days - overdue)</span>
                ) : null}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatPrice(dispute.payment?.amount ?? 0, { maxFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">
              {dispute.offer?.listing?.title ?? "Listing unavailable"}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm">{dispute.description}</p>
          {dispute.evidence_urls.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {dispute.evidence_urls.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#2563EB] hover:underline"
                >
                  Evidence {i + 1}
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {dispute.appeal_note ? (
          <div className="mt-3 rounded-lg bg-purple-50 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <ClockIcon className="size-3" />
              Appeal submitted
            </p>
            <p className="mt-1 text-sm text-purple-800">{dispute.appeal_note}</p>
            {dispute.appeal_evidence_urls.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {dispute.appeal_evidence_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-purple-600 hover:underline"
                  >
                    Appeal evidence {i + 1}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {dispute.status !== "closed" ? (
          <form action={formAction} className="mt-4 space-y-3 border-t pt-4">
            <input type="hidden" name="disputeId" value={dispute.id} />

            <div>
              <p className="mb-2 text-sm font-medium">Resolution</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(RESOLUTION_LABELS) as DisputeResolution[]).map((res) => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => setSelectedResolution(res)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedResolution === res
                        ? "border-[#2563EB] bg-[#2563EB]/10 text-[#2563EB]"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    {RESOLUTION_LABELS[res]}
                  </button>
                ))}
              </div>
              <input type="hidden" name="resolution" value={selectedResolution ?? ""} />
            </div>

            <div>
              <label htmlFor={`note-${dispute.id}`} className="mb-1 block text-sm font-medium">
                Admin note (optional)
              </label>
              <Textarea
                id={`note-${dispute.id}`}
                name="adminNote"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Explain your decision..."
                rows={2}
              />
            </div>

            <Button
              type="submit"
              disabled={!selectedResolution || pending}
              className="w-full sm:w-auto"
            >
              <CheckCircle2Icon className="mr-2 size-4" />
              {pending ? "Deciding..." : "Decide dispute"}
            </Button>

            {state.ok ? (
              <p className="text-sm text-green-600">Decision recorded!</p>
            ) : state.message ? (
              <p role="alert" className="text-sm text-destructive">{state.message}</p>
            ) : null}
          </form>
        ) : (
          <div className="mt-4 border-t pt-3">
            <p className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2Icon className="size-4" />
              Resolved: {dispute.resolution ? RESOLUTION_LABELS[dispute.resolution] : "Closed"}
            </p>
            {dispute.admin_note ? (
              <p className="mt-1 text-sm text-muted-foreground">{dispute.admin_note}</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
