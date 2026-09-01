"use client"

import Link from "next/link"
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("App route error:", error)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-50">
        <AlertTriangleIcon className="size-8 text-red-500" />
      </div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We could not load this page right now. This might be a temporary issue —
        try again in a moment.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>
          <RefreshCwIcon className="mr-1.5 size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <HomeIcon className="mr-1.5 size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </main>
  )
}
