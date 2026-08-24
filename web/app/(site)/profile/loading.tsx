import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-1 h-4 w-72 max-w-full" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Identity sidebar skeleton */}
        <div className="lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="bg-gradient-to-br from-[#172554] to-[#1e3a8a] px-6 pb-6 pt-8">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="size-24 rounded-full bg-white/20" />
              </div>
            </div>
            <div className="flex flex-col gap-4 p-6 pt-4">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-10 rounded-full" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form skeleton */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-1 h-4 w-64 max-w-full" />
            <div className="mt-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="mt-1 h-4 w-72 max-w-full" />
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-32" />
        </div>
      </div>
    </main>
  )
}
