import { Card, CardContent, CardHeader } from "@/components/ui/card"

export const metadata = { title: "Loading listing…" }

export default function ListingLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 animate-pulse md:grid-cols-2">
        {/* Gallery skeleton */}
        <div className="space-y-4">
          <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-16 w-16 rounded-md bg-muted" />
            ))}
          </div>
        </div>

        {/* Details skeleton */}
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <div className="h-6 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-7 w-1/3 rounded bg-muted" />
            </CardHeader>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-24 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="h-4 w-1/2 rounded bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
