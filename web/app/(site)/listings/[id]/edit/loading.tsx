import { Skeleton } from "@/components/ui/skeleton"

export default function EditListingLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />

      <div className="mt-6 rounded-lg border bg-card p-6">
        <div className="space-y-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>

      <Skeleton className="mt-4 h-11 w-full" />
    </main>
  )
}
