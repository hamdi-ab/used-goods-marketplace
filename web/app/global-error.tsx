"use client"

import Link from "next/link"
import { AlertTriangleIcon, RefreshCwIcon, HomeIcon, WifiOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  console.error("Unhandled app error:", error)

  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-background px-4 py-20 text-center font-sans text-foreground">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
          {online ? (
            <AlertTriangleIcon className="size-7 text-red-500" />
          ) : (
            <WifiOffIcon className="size-7 text-red-500" />
          )}
        </div>
        <h1 className="font-heading text-2xl font-semibold">
          {online ? "Something went wrong" : "You are offline"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {online
            ? "A critical error occurred. Please reload the page or try again."
            : "Check your internet connection and try again."}
        </p>
        <div className="flex gap-3">
          <Button type="button" onClick={reset}>
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
      </body>
    </html>
  )
}
