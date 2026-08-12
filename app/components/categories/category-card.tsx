import Link from "next/link"

import type { Category } from "@/lib/listings"

export function CategoryCard({
  category,
  active = false,
}: {
  category: Category
  active?: boolean
}) {
  const base =
    "group flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 text-center text-decoration-none"
  const tile = active
    ? "bg-primary text-primary-foreground"
    : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"

  return (
    <Link
      href={`?category=${category.slug}`}
      className={`${base} hover:border-primary`}
    >
      <span
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${tile}`}
      >
        {category.name.charAt(0)}
      </span>
      <span className="text-sm font-medium">{category.name}</span>
    </Link>
  )
}
