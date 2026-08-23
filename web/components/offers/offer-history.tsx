import type { OfferEventRow, OfferStatus } from "@/lib/offers"
import { formatPrice } from "@/lib/listings/constants"
import { formatRelativeDate } from "@/lib/utils"

interface OfferHistoryProps {
  events: OfferEventRow[]
  className?: string
}

const STATUS_LABELS: Record<OfferStatus, string> = {
  pending: "Offer submitted",
  countered: "Counter-offer",
  accepted: "Accepted",
  declined: "Declined",
  expired: "Expired",
}

function eventDescription(event: OfferEventRow): string {
  const amountLabel = event.amount ? ` — ${formatPrice(event.amount)}` : ""
  const base = STATUS_LABELS[event.to_status] ?? event.to_status

  if (event.message) {
    return `${amountLabel ? base + amountLabel : base}: "${event.message}"`
  }
  return amountLabel ? `${base} ${amountLabel}` : base
}

export function OfferHistory({ events, className }: OfferHistoryProps) {
  if (events.length === 0) return null

  return (
    <div className={className}>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Negotiation history
      </h4>
      <ol className="relative space-y-3 border-l border-muted pl-4">
        {events.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
            <p className="text-sm font-medium">{eventDescription(event)}</p>
            <p className="text-xs text-muted-foreground">
              {formatRelativeDate(event.created_at)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
