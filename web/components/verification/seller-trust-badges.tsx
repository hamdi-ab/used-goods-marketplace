import {
  sellerVerificationBadges,
  VERIFICATION_BADGE_NOTE,
  type SellerVerification,
} from "@/lib/verifications/constants"
import { VerificationBadge } from "@/components/verification/verification-badge"
import { Badge } from "@/components/ui/badge"

export function SellerTrustBadges({
  seller,
  variant = "default",
}: {
  seller: SellerVerification | null | undefined
  variant?: "default" | "light"
}) {
  const badges = sellerVerificationBadges(seller)
  const isLight = variant === "light"

  if (badges.length === 0) {
    return (
      <span
        className={isLight ? "text-xs text-white/70" : "text-xs text-muted-foreground"}
        aria-label={VERIFICATION_BADGE_NOTE}
      >
        {VERIFICATION_BADGE_NOTE}
      </span>
    )
  }

  if (isLight) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {badges.map((b) => (
          <Badge
            key={b}
            variant="outline"
            className="gap-1.5 border-white/25 bg-white/15 font-medium text-white"
          >
            <span className="size-1.5 rounded-full bg-white" />
            {b === "verified-seller" ? "Verified Seller" : b === "phone" ? "Phone verified" : "Fayda verified"}
          </Badge>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <VerificationBadge key={b} variant={b} />
      ))}
    </div>
  )
}
