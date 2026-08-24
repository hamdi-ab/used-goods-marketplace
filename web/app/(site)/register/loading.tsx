import { Skeleton } from "@/components/ui/skeleton"

export default function RegisterLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <Skeleton className="mx-auto mb-5 size-12 rounded-2xl" />
        <Skeleton className="mx-auto mb-6 h-4 w-36" />
        <div className="rounded-2xl border bg-card p-6 shadow-lg sm:p-8">
          <Skeleton className="mx-auto mb-6 h-4 w-52" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="mt-2 h-10 w-full" />
          </div>
        </div>
      </div>
    </main>
  )
}
