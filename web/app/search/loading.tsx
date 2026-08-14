import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <div className="mb-8 space-y-3">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="rounded-lg border bg-card p-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="mt-4 h-9 w-full" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] rounded-lg" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/3" />
          </div>
        ))}
      </div>
    </main>
  )
}
