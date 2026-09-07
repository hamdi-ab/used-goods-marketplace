import {
  sellerVerificationBadges,
  VERIFICATION_BADGE_NOTE,
  type SellerVerification,
} from "@/lib/verifications/constants"
import { VerificationBadge } from "@/components/verification/verification-badge"

export function SellerTrustBadges({
  seller,
}: {
  seller: SellerVerification | null | undefined
}) {
  const badges = sellerVerificationBadges(seller)
  if (badges.length === 0) {
    return (
      <span
        className="text-xs text-muted-foreground"
        aria-label={VERIFICATION_BADGE_NOTE}
      >
        {VERIFICATION_BADGE_NOTE}
      </span>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((variant) => (
        <VerificationBadge key={variant} variant={variant} />
      ))}
    </div>
  )
}
