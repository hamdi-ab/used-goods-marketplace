export default function SellerOffersLoading() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-lg border bg-background">
            <div className="flex items-start gap-3 p-4">
              <div className="size-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded bg-muted" />
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-3 w-1/3 rounded bg-muted" />
              </div>
            </div>
            <div className="mx-4 border-t" />
            <div className="flex gap-2 px-4 pt-3">
              <div className="h-8 w-20 rounded bg-muted" />
              <div className="h-8 w-20 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
