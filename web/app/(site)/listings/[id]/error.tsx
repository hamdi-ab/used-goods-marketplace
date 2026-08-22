"use client"

import Link from "next/link"
import { AlertTriangleIcon, RefreshCwIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ListingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Listing route error:", error)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangleIcon className="size-7 text-red-500" />
      </div>
      <h1 className="font-heading text-2xl font-semibold">
        Could not load listing
      </h1>
      <p className="text-sm text-muted-foreground">
        We could not load this listing right now. It may have been removed or is
        temporarily unavailable.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>
          <RefreshCwIcon className="mr-1.5 size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">
            <SearchIcon className="mr-1.5 size-4" />
            Browse listings
          </Link>
        </Button>
      </div>
    </main>
  )
}
