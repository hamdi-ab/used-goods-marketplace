import { notFound } from "next/navigation"

import { requireSeller } from "@/lib/auth"
import { fetchCategories, fetchListing } from "@/lib/listings"
import { EditListingForm } from "@/components/listings/edit-listing-form"

export const dynamic = "force-dynamic"

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireSeller()
  const { id } = await params
  const data = await fetchListing(id, { includeSeller: false })
  if (!data) notFound()
  // Only the owning seller (or an admin) may edit.
  if (data.listing.seller_id !== user.id && user.role !== "admin") notFound()

  const categories = await fetchCategories()
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-semibold text-foreground">
        Edit listing
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your listing details. Changes are saved immediately.
      </p>
      <EditListingForm listing={data.listing} categories={categories} />
    </main>
  )
}
