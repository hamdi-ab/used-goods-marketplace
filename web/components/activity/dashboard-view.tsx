import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { countIncomingOffers } from "@/lib/offers"
import { fetchSellerRatingSummary } from "@/lib/reviews"

export async function DashboardView({ userId }: { userId: string }) {
  const [incomingCount, ratingSummary] = await Promise.all([
    countIncomingOffers(userId),
    fetchSellerRatingSummary(userId),
  ])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Incoming Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active buyer offers awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Seller Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ratingSummary.average != null ? `${ratingSummary.average.toFixed(1)} / 5` : "No ratings"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {ratingSummary.count} review{ratingSummary.count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-xl border bg-card p-6 text-center">
        <h3 className="font-semibold mb-1">Full Dashboard Access</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Visit your seller dashboard for detailed management, payout requests, and analytics.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
