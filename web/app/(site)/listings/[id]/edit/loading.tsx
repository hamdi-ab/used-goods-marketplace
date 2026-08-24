import { Skeleton } from "@/components/ui/skeleton"

export default function EditListingLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-1 h-4 w-72 max-w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left column: form skeleton */}
        <div className="min-w-0">
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-4 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-28 w-full" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Skeleton className="h-11 w-32" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>

        {/* Right column: publishing rail skeleton */}
        <aside className="h-fit rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] shadow-sm lg:sticky lg:top-6">
          <div className="flex flex-col gap-4 p-5">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-1 h-5 w-1/3" />
                <div className="mt-2 flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </aside>
      </div>
    </main>
  )
}
