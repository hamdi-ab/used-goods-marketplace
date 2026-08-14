"use client"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  console.error("Unhandled app error:", error)
  return (
    <html lang="en">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 bg-background px-4 py-20 text-center font-sans text-foreground">
        <h1 className="font-heading text-2xl font-semibold">
          Something went wrong
        </h1>
        <p className="text-sm text-muted-foreground">
          A critical error occurred. Please reload the page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </body>
    </html>
  )
}