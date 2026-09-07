"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClockIcon,
  ScaleIcon,
} from "lucide-react"

import type { DisputeWithRelations, DisputeResolution } from "@/lib/disputes"
import { formatPrice } from "@/lib/listings/constants"
import { formatShortDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppealForm } from "./appeal-form"

interface UserDisputeCardProps {
  dispute: DisputeWithRelations
  currentUserId: string
}

const RESOLUTION_LABELS: Record<DisputeResolution, string> = {
  refund_buyer: "Refund buyer",
  pay_seller: "Pay seller",
  partial_refund: "Partial refund",
  no_action: "No action",
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved_buyer: "bg-green-100 text-green-800",
  resolved_seller: "bg-green-100 text-green-800",
  appealed: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "resolved_buyer":
    case "resolved_seller":
    case "closed":
      return <CheckCircle2Icon className="size-5 text-green-600" />
    case "appealed":
      return <ScaleIcon className="size-5 text-purple-600" />
    default:
      return <AlertTriangleIcon className="size-5 text-amber-600" />
  }
}

export function UserDisputeCard({ dispute, currentUserId }: UserDisputeCardProps) {
  const isOpener = dispute.opened_by === currentUserId
  const createdDate = formatShortDate(dispute.created_at)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100">
              <StatusIcon status={dispute.status} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{dispute.reason.replace(/_/g, " ")}</span>
                <Badge className={STATUS_STYLES[dispute.status] ?? "bg-gray-100 text-gray-800"}>
                  {dispute.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {isOpener ? "Opened" : "Involved in"} {createdDate} ·{" "}
                {dispute.offer?.listing?.title ?? "Listing unavailable"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatPrice(dispute.payment?.amount ?? 0, { maxFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-sm">{dispute.description}</p>
        </div>

        {dispute.appeal_note ? (
          <div className="mt-3 rounded-lg bg-purple-50 p-3">
            <p className="flex items-center gap-2 text-xs font-medium text-purple-700">
              <ClockIcon className="size-3" />
              Appeal submitted
            </p>
            <p className="mt-1 text-sm text-purple-800">{dispute.appeal_note}</p>
          </div>
        ) : null}

        {dispute.admin_note && (dispute.status === "resolved_buyer" || dispute.status === "resolved_seller" || dispute.status === "closed") ? (
          <div className="mt-3 rounded-lg bg-green-50 p-3">
            <p className="text-xs font-medium text-green-700">Admin decision</p>
            <p className="mt-1 text-sm text-green-800">
              {dispute.resolution ? RESOLUTION_LABELS[dispute.resolution] : "Resolved"}
              {dispute.admin_note ? ` — ${dispute.admin_note}` : ""}
            </p>
          </div>
        ) : null}

        <div className="mt-4 border-t pt-3">
          <AppealForm dispute={dispute} />
        </div>
      </CardContent>
    </Card>
  )
}
