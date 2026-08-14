import { Skeleton } from "@/components/ui/skeleton"

export default function RegisterLoading() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-lg border bg-card">
        <div className="space-y-2 p-6 text-center">
          <Skeleton className="mx-auto h-6 w-44" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
        <div className="space-y-4 px-6 pb-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </main>
  )
}