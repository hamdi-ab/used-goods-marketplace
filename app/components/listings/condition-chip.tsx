import { Badge } from "@/components/ui/badge"

import type { Condition } from "@/lib/listings"

const CONDITION_COLORS: Record<string, string> = {
  "Brand New": "bg-green-100 text-green-800",
  "Lightly Used": "bg-blue-100 text-blue-800",
  Fair: "bg-amber-100 text-amber-800",
}

export function ConditionChip({ condition }: { condition: Condition }) {
  const className = CONDITION_COLORS[condition] ?? "bg-neutral-100 text-neutral-800"
  return (
    <Badge variant="secondary" className={className}>
      {condition}
    </Badge>
  )
}
