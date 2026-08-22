import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { fetchCategories, fetchListing } from "@/lib/listings"
import { CONDITIONS, STATUSES_FOR_DISPLAY } from "@/lib/listings/constants"
import { formatPrice } from "@/lib/listings"
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/form-fields"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/home/header"
import { SiteFooter } from "@/components/home/footer"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Edit listing",
  description: "Update your listing details.",
}

// PROTOTYPE — listing-edit redesign, "Split Editor" (moodboard option A):
// two-column canvas with form fields left and a sticky preview + publishing
// rail right (live listing card, photo strip, status, pinned Save/Archive).
// View-only during review: inputs are inert and nothing submits; real listing
// data pre-fills the form so the layout is judged against the actual product.
export async function PrototypeEditPage({
  variant,
  params,
}: {
  variant: VariantKey
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await fetchListing(id, { includeSeller: false })
  if (!data) notFound()

  const categories = await fetchCategories()
  const { listing, images } = data
  const category = categories.find((c) => c.id === listing.category_id) ?? null
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order)

  const railStyle =
    variant === "B"
      ? "border-[#2563EB]/30 bg-[#EEF4FF]"
      : "border-border bg-card"

  const field = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} readOnly className={cn(FIELD_CLASS, "read-only:opacity-70")} />
  )

  return (
    <>
      <SiteHeader variant={variant} />
      <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        <div className="min-w-0">
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
              href={withVariant(`/listings/${listing.id}`, variant)}
              className="text-sm font-medium text-[#2563EB] hover:underline"
            >
              View listing →
            </Link>
          </div>

          {/* Details */}
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <h2 className="border-b px-5 py-4 font-heading text-base font-semibold">
              Details
            </h2>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="p-title" className="text-sm font-medium">
                  Title *
                </label>
                {field({ id: "p-title", value: listing.title })}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="p-description" className="text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="p-description"
                  rows={5}
                  readOnly
                  defaultValue={listing.description ?? ""}
                  className={cn(TEXTAREA_CLASS, "read-only:opacity-70")}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="p-price" className="text-sm font-medium">
                    Price (ETB) *
                  </label>
                  {field({ id: "p-price", type: "number", value: listing.price })}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium">Condition *</span>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {CONDITIONS.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="p-condition"
                          value={c}
                          defaultChecked={listing.condition === c}
                          disabled
                          className="accent-primary"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="p-category" className="text-sm font-medium">
                  Category *
                </label>
                <select
                  id="p-category"
                  disabled
                  defaultValue={listing.category_id ?? ""}
                  className={cn(FIELD_CLASS, "disabled:opacity-70")}
                >
                  <option value="">Pick a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
            <h2 className="border-b px-5 py-4 font-heading text-base font-semibold">
              Location
            </h2>
            <div className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label htmlFor="p-city" className="text-sm font-medium">
                    City *
                  </label>
                  {field({ id: "p-city", value: listing.city ?? "" })}
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="p-subCity" className="text-sm font-medium">
                    Sub-city / neighborhood
                  </label>
                  {field({ id: "p-subCity", value: listing.sub_city ?? "" })}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="p-address" className="text-sm font-medium">
                  Address (optional)
                </label>
                {field({ id: "p-address", value: listing.address ?? "" })}
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="p-negotiable"
                  defaultChecked={listing.negotiable}
                  disabled
                  className="accent-primary"
                />
                Price is negotiable
              </label>
            </div>
          </section>
        </div>

        {/* Publishing rail */}
        <aside className={cn("h-fit rounded-2xl border shadow-sm lg:sticky lg:top-6", railStyle)}>
          <div className="flex flex-col gap-4 p-5">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {sortedImages[0] ? (
                <div className="relative aspect-[16/9] w-full bg-muted">
                  <Image
                    src={sortedImages[0].image_url}
                    alt={listing.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 340px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted text-sm text-muted-foreground">
                  No photo
                </div>
              )}
              <div className="p-4">
                <p className="line-clamp-2 text-sm font-semibold text-foreground">
                  {listing.title}
                </p>
                <p className="mt-1 text-lg font-extrabold text-[#2563EB]">
                  {formatPrice(listing.price, { maxFractionDigits: 2 })}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {listing.condition}
                  </span>
                  {category ? (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {category.name}
                    </span>
                  ) : null}
                  {listing.negotiable ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Negotiable
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Photo strip */}
            {sortedImages.length > 1 ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {sortedImages.length} photos
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {sortedImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-muted"
                    >
                      <Image
                        src={img.image_url}
                        alt={img.alt_text ?? listing.title}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <label htmlFor="p-status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="p-status"
                disabled
                defaultValue={listing.status}
                className={cn(FIELD_CLASS, "disabled:opacity-70")}
              >
                {STATUSES_FOR_DISPLAY.map((s) => (
                  <option key={s.value} value={s.value} disabled={s.disabled}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <Button
                type="button"
                disabled
                className="h-11"
                title="Prototype preview — edits aren't saved yet"
              >
                Save changes
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled
                className="h-11"
                title="Prototype preview — edits aren't saved yet"
              >
                Archive listing
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Preview mode — nothing is saved
              </p>
            </div>
          </div>
        </aside>
      </main>
      <SiteFooter variant={variant} />
    </>
  )
}