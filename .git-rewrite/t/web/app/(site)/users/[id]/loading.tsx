import { Skeleton } from "@/components/ui/skeleton"

export default function UserProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile Hero skeleton */}
      <div className="mb-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="bg-gradient-to-br from-[#172554] to-[#1e3a8a] px-6 pb-8 pt-8 sm:px-8 sm:pb-10 sm:pt-10">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-6">
            <Skeleton className="size-24 rounded-full bg-white/20" />
            <div className="flex flex-col items-center gap-3 sm:items-start">
              <Skeleton className="h-7 w-48 bg-white/20" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-20 rounded-full bg-white/20" />
                <Skeleton className="h-5 w-24 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x border-b sm:grid-cols-4">
          <div className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-16" />
            <Skeleton className="mx-auto mt-1 h-6 w-12" />
          </div>
          <div className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-12" />
            <Skeleton className="mx-auto mt-1 h-6 w-8" />
          </div>
          <div className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-14" />
            <Skeleton className="mx-auto mt-1 h-6 w-8" />
          </div>
          <div className="p-4 text-center">
            <Skeleton className="mx-auto h-4 w-10" />
            <Skeleton className="mx-auto mt-1 h-6 w-16" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left sidebar skeleton */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-28" />
            <div className="mt-4 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>

        {/* Right column: reviews skeleton */}
        <div className="lg:col-span-8">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-20" />
            <div className="mt-4 flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="mt-4 space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
