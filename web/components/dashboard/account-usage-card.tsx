import Link from "next/link"

import type { AccountUsage } from "@/lib/usage"
import { TIER_LABELS, isAtCap } from "@/lib/plans/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function ProgressBar({
  used,
  limit,
  over,
}: {
  used: number
  limit: number | null
  over?: boolean
}) {
  const pct = limit === null || limit === 0 ? 0 : Math.min((used / limit) * 100, 100)
  return (
    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={
          "h-full rounded-full transition-all" +
          (over
            ? " bg-destructive"
            : " bg-primary")
        }
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function QuotaRow({
  label,
  used,
  limit,
  over,
}: {
  label: string
  used: number
  limit: number | null
  over?: boolean
}) {
  const display = limit === null ? `${used}` : `${used}/${limit}`
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive" : "font-medium"}>
          {display}
        </span>
      </div>
      <ProgressBar used={used} limit={limit} over={over} />
    </div>
  )
}

// Dashboard "VinTech account" card (T28 / strategy §33). Usage reads as an
// upgrade to headroom, never a restriction; the near-cap state flips the meter
// red so it doubles as the listings-header "nudge".
export function AccountUsageCard({ usage }: { usage: AccountUsage }) {
  const overCap = isAtCap(usage.activeListings.used, usage.activeListings.limit)
  const aiOverCap = isAtCap(usage.aiGenerations.used, usage.aiGenerations.limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your VinTech account</CardTitle>
        <CardDescription>
          {TIER_LABELS[usage.tier]} plan • active listing & AI usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <QuotaRow
          label="Active listings"
          used={usage.activeListings.used}
          limit={usage.activeListings.limit}
          over={overCap}
        />
        <QuotaRow
          label="AI credits this month"
          used={usage.aiGenerations.used}
          limit={usage.aiGenerations.limit}
          over={aiOverCap}
        />

        {overCap ? (
          <p className="mt-3 text-sm text-destructive">
            You&apos;ve reached your free listing limit. Mark an item sold or archive
            an old one to free a slot, or upgrade to Pro.
          </p>
        ) : usage.tier === "free" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Need more headroom? Pro gives you 25 listings and 30 AI credits.
          </p>
        ) : null}

        {usage.tier === "free" ? (
          <Button asChild className="mt-4 w-full sm:mt-3">
            <Link href="/pricing">Upgrade to Pro</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
