import Link from "next/link"
import { HomeIcon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
        <SearchIcon className="size-8 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-primary">
        404
      </p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The page you are looking for does not exist or has been moved. Try
        searching or head back to the home page.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">
            <HomeIcon className="mr-1.5 size-4" />
            Back to home
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/search">Browse listings</Link>
        </Button>
      </div>
    </main>
  )
}
