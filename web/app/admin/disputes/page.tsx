import type { Metadata } from "next"
import { AlertTriangleIcon } from "lucide-react"

import { fetchAdminDisputes } from "@/lib/disputes"
import { AdminDisputeCard } from "@/components/disputes/admin-dispute-card"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Disputes",
  description: "Review and resolve transaction disputes between buyers and sellers.",
}

export default async function AdminDisputesPage() {
  const disputes = await fetchAdminDisputes()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Disputes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review transaction disputes and resolve them. Decisions can be appealed once with new evidence.
        </p>
      </div>

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <AlertTriangleIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              No open disputes
            </h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              Disputes opened by buyers or sellers will appear here for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {disputes.map((dispute) => (
            <li key={dispute.id}>
              <AdminDisputeCard dispute={dispute} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
