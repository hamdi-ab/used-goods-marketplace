import type { Metadata } from "next"
import Link from "next/link"
import { ShieldIcon } from "lucide-react"

import { requireAdmin } from "@/lib/auth"
import { fetchAdminReports } from "@/lib/reports"
import { AdminReportCard } from "@/components/reports/admin-report-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin — Reports",
  description: "Moderation queue for reported listings and sellers.",
}

export default async function AdminReportsPage() {
  const user = await requireAdmin()
  const reports = await fetchAdminReports()

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Moderation queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.fullName
              ? `Signed in as ${user.fullName}`
              : "Signed in as admin"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">← Back to dashboard</Link>
        </Button>
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
    </main>
  )
}
