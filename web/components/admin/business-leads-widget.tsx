import Link from "next/link"

import { fetchBusinessLeads } from "@/app/actions/business-leads"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Building2Icon } from "lucide-react"

export async function BusinessLeadsWidget() {
  const leads = await fetchBusinessLeads()
  const newCount = leads.filter((l) => l.status === "new").length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2Icon className="size-5 text-primary" />
          Business leads
          {newCount > 0 ? (
            <Badge variant="secondary">{newCount} new</Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Sellers who requested Business tier info.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No Business leads yet. They appear here when sellers request info from the pricing page.
          </p>
        ) : (
          <>
            <ul className="mb-4 flex flex-col gap-3">
              {leads.slice(0, 5).map((lead) => (
                <li
                  key={lead.id}
                  className="rounded-lg border border-border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">
                      {lead.name}
                    </span>
                    <Badge
                      variant={lead.status === "new" ? "default" : "outline"}
                      className="text-xs"
                    >
                      {lead.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {lead.email}
                    {lead.phone ? ` · ${lead.phone}` : ""}
                    {lead.company ? ` · ${lead.company}` : ""}
                  </p>
                  {lead.needs ? (
                    <p className="mt-1 text-sm text-foreground/80">
                      {lead.needs}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/business-leads">View all leads</Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
