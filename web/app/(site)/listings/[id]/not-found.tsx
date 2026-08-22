import Link from "next/link"
import { PackageIcon, SearchIcon, HomeIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ListingNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-muted">
        <PackageIcon className="size-8 text-muted-foreground" />
      </div>
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-primary">
        404
      </p>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">
        Listing not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This listing may have been removed, archived, or never existed. Try
        browsing other listings.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/search">
            <SearchIcon className="mr-1.5 size-4" />
            Browse listings
          </Link>
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
