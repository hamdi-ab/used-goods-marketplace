import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function ListingNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <h1 className="font-heading text-2xl font-semibold">Listing not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This listing may have been removed, archived, or never existed.
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "link", size: "lg" }), "mt-4")}>
        Back to all listings
      </Link>
    </main>
  )
}
