import type { Metadata } from "next"
import { ShieldIcon } from "lucide-react"

import { fetchAdminReports } from "@/lib/reports"
import { AdminReportCard } from "@/components/reports/admin-report-card"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Reports",
  description: "Moderation queue for reported listings and sellers.",
}

export default async function AdminReportsPage() {
  const reports = await fetchAdminReports()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Moderation queue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review reports and resolve them. Block a seller to demote them to a
          buyer, or remove a listing to archive it.
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <ShieldIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              All caught up
            </h2>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              There are no open reports to review right now.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {reports.map((report) => (
            <li key={report.id}>
              <AdminReportCard report={report} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
