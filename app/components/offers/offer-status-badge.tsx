"use client"

import { cn } from "@/lib/utils"
import {
  OFFER_STATUS_COLORS,
  OFFER_STATUS_LABELS,
  type OfferStatus,
} from "@/lib/offers/constants"
import { Badge } from "@/components/ui/badge"

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  return (
    <Badge className={cn(OFFER_STATUS_COLORS[status])}>
      {OFFER_STATUS_LABELS[status]}
    </Badge>
  )
}
