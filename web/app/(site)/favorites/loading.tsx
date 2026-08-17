import { Skeleton } from "@/components/ui/skeleton"

export default function FavoritesLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <Skeleton className="mb-8 h-7 w-48" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/4" />
          </div>
        ))}
      </div>
    </main>
  )
}
