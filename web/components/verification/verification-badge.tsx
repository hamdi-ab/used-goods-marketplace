import type { ComponentType, SVGProps } from "react"
import { CheckCircleIcon, PhoneIcon, ShieldIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  type VerificationBadge,
  VERIFICATION_BADGE_LABELS,
} from "@/lib/verifications/constants"
import { Badge } from "@/components/ui/badge"

// One small, reusable status badge per verification variant. Pure (no
// "use client"): renders identically from a server component.
const ICON: Record<VerificationBadge, ComponentType<SVGProps<SVGSVGElement>>> = {
  "verified-seller": ShieldIcon,
  phone: PhoneIcon,
  fayda: CheckCircleIcon,
}

// Palette per the design token guidance (Primary #2563EB for the seller
// badge, blue for phone, purple for the Fayda placeholder): keep them soft so
// badges never compete with the listing for attention.
const VARIANT_CLASS: Record<VerificationBadge, string> = {
  "verified-seller": "bg-primary/10 text-primary",
  phone: "bg-blue-100 text-blue-800",
  fayda: "bg-purple-100 text-purple-800",
}

export function VerificationBadge({ variant }: { variant: VerificationBadge }) {
  const Icon = ICON[variant]
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5", VARIANT_CLASS[variant])}
      aria-label={VERIFICATION_BADGE_LABELS[variant]}
    >
      <Icon className="size-3 shrink-0" />
      <span>{VERIFICATION_BADGE_LABELS[variant]}</span>
    </Badge>
  )
}
