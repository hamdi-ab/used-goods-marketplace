import type { Metadata } from "next"

import { getCurrentUser } from "@/lib/auth"
import { fetchCategories, fetchListings, PAGE_SIZE } from "@/lib/listings"
import { fetchFavoriteIds } from "@/lib/favorites"
import { parseBrowseParams } from "@/lib/browse"
import { HomePage } from "@/components/home/home-page"

export const metadata: Metadata = {
  title: "Dagim Gebeya — Trusted second-hand marketplace in Ethiopia",
  description:
    "Buy and sell second-hand goods confidently across Ethiopia with verified sellers and AI-assisted listings.",
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const { categorySlug, offset } = parseBrowseParams(sp)

  const [user, categories, { listings }] = await Promise.all([
    getCurrentUser(),
    fetchCategories(),
    fetchListings({
      limit: PAGE_SIZE,
      offset,
      categorySlug,
    }),
  ])
  const favoriteIds = user ? new Set(await fetchFavoriteIds(user.id)) : null

  return (
    <HomePage
      categories={categories}
      listings={listings}
      favoriteIds={favoriteIds}
    />
  )
}
