import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </main>
  )
}