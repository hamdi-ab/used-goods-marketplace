import { StarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { RATING_MAX } from "@/lib/reviews/constants"

function boundedRating(rating: number): number {
  const n = Math.round(rating)
  return n < 1 ? 1 : n > RATING_MAX ? RATING_MAX : n
}

// Read-only star display used wherever a rating is surfaced: the profile review
// list, the profile header aggregate, and the "you rated X" line on the offers
// page. Pure (no "use client") so a Server Component can render it directly.
export function ReviewStars({
  rating,
  size = "sm",
  className,
}: {
  rating: number
  size?: "xs" | "sm" | "md"
  className?: string
}) {
  const filled = boundedRating(rating)
  const sizeClass = {
    xs: "size-3",
    sm: "size-4",
    md: "size-5",
  }[size]
  return (
    <div className={cn("flex items-center gap-0.5", className)} aria-label={`Rating ${rating} out of ${RATING_MAX}`}>
      {Array.from({ length: RATING_MAX }, (_, i) => (
        <StarIcon
          key={i}
          className={cn(
            "shrink-0",
            sizeClass,
            i < filled
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/40"
          )}
        />
      ))}
    </div>
  )
}
