import { notFound } from "next/navigation"
import Link from "next/link"

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
  if (data.listing.seller_id !== user.id && user.role !== "admin") notFound()

  const categories = await fetchCategories()
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Edit listing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Update your listing details. Changes are saved immediately.
          </p>
        </div>
        <Link
          href={`/listings/${data.listing.id}`}
          className="text-sm font-medium text-[#2563EB] hover:underline"
        >
          View listing →
        </Link>
      </div>
      <EditListingForm listing={data.listing} categories={categories} images={data.images} />
    </main>
  )
}
