import { fetchBusinessLeads } from "@/app/actions/business-leads"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function BusinessLeadsPage() {
  const leads = await fetchBusinessLeads()

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Business leads
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Sellers who requested Business tier info from the pricing page.
        </p>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No Business leads yet. They appear here when sellers request info from the pricing page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {leads.map((lead) => (
            <Card key={lead.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{lead.name}</CardTitle>
                  <Badge
                    variant={lead.status === "new" ? "default" : "outline"}
                  >
                    {lead.status}
                  </Badge>
                </div>
                <CardDescription>
                  {lead.email}
                  {lead.phone ? ` · ${lead.phone}` : ""}
                  {lead.company ? ` · ${lead.company}` : ""}
                </CardDescription>
              </CardHeader>
              {lead.needs ? (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{lead.needs}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Submitted{" "}
                    {new Date(lead.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </CardContent>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
