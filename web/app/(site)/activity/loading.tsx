import { ActivitySkeleton } from "@/components/activity/activity-skeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function ActivityLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-36 rounded-md" />
      </div>
      <ActivitySkeleton />
    </div>
  )
}
