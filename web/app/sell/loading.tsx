import { Skeleton } from "@/components/ui/skeleton"

export default function SellLoading() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <div className="mt-6 space-y-4 rounded-lg border bg-card p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  )
}