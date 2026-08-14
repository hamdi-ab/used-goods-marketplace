import { Skeleton } from "@/components/ui/skeleton"

export default function HomeLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <section className="mb-12 text-center">
        <Skeleton className="mx-auto h-10 w-3/4 max-w-xl" />
        <Skeleton className="mx-auto mt-3 h-4 w-1/2 max-w-sm" />
        <div className="mx-auto mt-6 flex w-64 justify-center gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </section>

      <section className="mb-10">
        <Skeleton className="h-6 w-48" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </section>

      <section>
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/3] w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/4" />
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
