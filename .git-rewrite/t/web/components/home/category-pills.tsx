import Link from "next/link"

import type { Category } from "@/lib/listings"


// chips that mirror the search-page filter. Throwaway for design comparison.
export function CategoryPills({ categories }: { categories: Category[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/search"
        className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.id}
          href={`/search?category=${c.slug}`}
          className="shrink-0 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
        >
          {c.name}
        </Link>
      ))}
    </div>
  )
}
