import { cn } from "@/lib/utils"
import {
  LISTING_STATUS_COLORS,
  LISTING_STATUS_LABELS,
  type ListingStatus,
} from "@/lib/listings/constants"
import { Badge } from "@/components/ui/badge"

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return (
    <Badge className={cn(LISTING_STATUS_COLORS[status])}>
      {LISTING_STATUS_LABELS[status]}
    </Badge>
  )
}