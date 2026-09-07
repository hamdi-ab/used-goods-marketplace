import type { Metadata } from "next"
import { AlertTriangleIcon } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { fetchUserDisputes } from "@/lib/disputes"
import { UserDisputeCard } from "@/components/disputes/user-dispute-card"
import { Card, CardContent } from "@/components/ui/card"
import { Breadcrumbs } from "@/components/ui/breadcrumbs"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "My disputes",
  description: "Track the status of your disputes.",
}

export default async function MyDisputesPage() {
  const user = await requireUser()
  const disputes = await fetchUserDisputes(user.id)

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8 min-h-[60vh]">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My disputes" },
        ]}
      />

      <div className="mt-4">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          My disputes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track the status of disputes you opened or are involved in.
        </p>
      </div>

      <div className="mt-6">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <AlertTriangleIcon className="size-8 text-muted-foreground" />
              <h2 className="font-heading text-lg font-semibold">No disputes</h2>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                You have no active disputes. Disputes you open will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {disputes.map((dispute) => (
              <li key={dispute.id}>
                <UserDisputeCard dispute={dispute} currentUserId={user.id} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
