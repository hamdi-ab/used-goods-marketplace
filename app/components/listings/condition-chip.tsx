import { Badge } from "@/components/ui/badge"

import { CONDITION_COLORS } from "@/lib/listings"
import type { Condition } from "@/lib/listings"

export function ConditionChip({ condition }: { condition: Condition }) {
  const className = CONDITION_COLORS[condition] ?? "bg-neutral-100 text-neutral-800"
  return (
    <Badge variant="secondary" className={className}>
      {condition}
    </Badge>
  )
}
