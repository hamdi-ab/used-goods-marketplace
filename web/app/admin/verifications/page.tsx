import type { Metadata } from "next"
import { BadgeCheckIcon } from "lucide-react"

import { fetchAdminVerifications } from "@/lib/verifications"
import { AdminVerificationCard } from "@/components/admin/admin-verification-card"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Verification Review",
  description: "Review phone verification requests.",
}

export default async function AdminVerificationsPage() {
  const requests = await fetchAdminVerifications()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Verification review
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Approve or reject phone verification requests. Approving
          flips the applicant&apos;s trust badge and bumps their Trust Score;
          rejecting clears the request.
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <BadgeCheckIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              All caught up
            </h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              There are no verification requests to review right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((request) => (
            <li key={request.id}>
              <AdminVerificationCard request={request} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
