"use client"

import { useState } from "react"
import { useActionState } from "react"
import { XIcon, CameraIcon } from "lucide-react"
import Image from "next/image"

import { updateListing, deleteListing } from "@/app/actions/listings"
import { CONDITIONS, STATUSES_FOR_DISPLAY, formatPrice } from "@/lib/listings/constants"
import type { Category, Listing } from "@/lib/listings"
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ListingImage {
  id: string
  image_url: string
  alt_text: string | null
  display_order: number
}

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function EditListingForm({
  listing,
  categories,
  images = [],
}: {
  listing: Listing
  categories: Category[]
  images?: ListingImage[]
}) {
  const [state, formAction, pending] = useActionState(updateListing, {})
  const [deleteState, deleteAction, deletePending] = useActionState(deleteListing, {})
  const [title, setTitle] = useState(listing.title)
  const [price, setPrice] = useState(listing.price.toString())
  const [condition, setCondition] = useState(listing.condition)
  const [negotiable, setNegotiable] = useState(listing.negotiable)
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order)
  const category = categories.find((c) => c.id === listing.category_id) ?? null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      {/* Left column: form fields */}
      <div className="min-w-0">
        <form action={formAction} id="edit-listing-form">
          <input type="hidden" name="id" value={listing.id} readOnly />

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <h2 className="border-b px-5 py-4 font-heading text-base font-semibold">
              Details
            </h2>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  aria-invalid={!!state.errors?.title}
                />
                <FieldError message={state.errors?.title?.[0]} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  defaultValue={listing.description ?? ""}
                  className={TEXTAREA_CLASS}
                />
                <FieldError message={state.errors?.description?.[0]} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="price">Price (ETB) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    aria-invalid={!!state.errors?.price}
                  />
                  <FieldError message={state.errors?.price?.[0]} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Condition *</Label>
                  <div className="flex flex-wrap gap-3 pt-1">
                    {CONDITIONS.map((c) => (
                      <label key={c} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="condition"
                          value={c}
                          checked={condition === c}
                          onChange={() => setCondition(c)}
                          required
                          className="accent-primary"
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                  <FieldError message={state.errors?.condition?.[0]} />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="categoryId">Category *</Label>
                <select
                  id="categoryId"
                  name="categoryId"
                  className={FIELD_CLASS}
                  defaultValue={listing.category_id ?? ""}
                  aria-invalid={!!state.errors?.categoryId}
                >
                  <option value="">Pick a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <FieldError message={state.errors?.categoryId?.[0]} />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
            <h2 className="border-b px-5 py-4 font-heading text-base font-semibold">
              Location
            </h2>
            <div className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    defaultValue={listing.city ?? ""}
                    aria-invalid={!!state.errors?.city}
                  />
                  <FieldError message={state.errors?.city?.[0]} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subCity">Sub-city / neighborhood</Label>
                  <Input id="subCity" name="subCity" defaultValue={listing.sub_city ?? ""} />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address">Address (optional)</Label>
                <Input id="address" name="address" defaultValue={listing.address ?? ""} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="negotiable"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="accent-primary"
                />
                Price is negotiable
              </label>
            </div>
          </section>

          {state.message ? <p className="mt-4 text-sm text-destructive">{state.message}</p> : null}
          {state.ok ? <p className="mt-4 text-sm text-green-600">Listing updated.</p> : null}

          <div className="mt-4 flex gap-3">
            <Button type="submit" form="edit-listing-form" disabled={pending} className="h-11">
              {pending ? "Saving…" : "Save changes"}
            </Button>
            <Button
              type="submit"
              form="delete-listing-form"
              variant="destructive"
              disabled={deletePending}
              className="h-11"
            >
              <XIcon className="mr-2 size-4" />
              {deletePending ? "Archiving…" : "Archive listing"}
            </Button>
          </div>
        </form>

        <form
          id="delete-listing-form"
          action={deleteAction}
          onSubmit={(e) => {
            if (!confirm("Archive this listing? It will no longer be visible."))
              e.preventDefault()
          }}
        >
          <input type="hidden" name="id" value={listing.id} readOnly />
        </form>

        {deleteState.message ? (
          <p className="mt-4 text-sm text-destructive">{deleteState.message}</p>
        ) : null}
      </div>

      {/* Right column: publishing rail */}
      <aside className="h-fit rounded-2xl border border-[#2563EB]/30 bg-[#EEF4FF] shadow-sm lg:sticky lg:top-6">
        <div className="flex flex-col gap-4 p-5">
          {/* Live listing card preview */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {sortedImages[0] ? (
              <Image
                src={sortedImages[0].image_url}
                alt={listing.title}
                width={320}
                height={180}
                className="aspect-[16/9] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center bg-muted">
                <CameraIcon className="size-8 text-muted-foreground/50" />
              </div>
            )}
            <div className="p-4">
              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                {title || "Listing title"}
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#2563EB]">
                {formatPrice(Number.isFinite(Number(price)) ? Number(price) : 0, { maxFractionDigits: 2 })}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {condition ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {condition}
                  </span>
                ) : null}
                {category ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {category.name}
                  </span>
                ) : null}
                {negotiable ? (
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
                  <Image
                    key={img.id}
                    src={img.image_url}
                    alt={img.alt_text ?? listing.title}
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Status */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <select
              id="status"
              name="status"
              form="edit-listing-form"
              className={FIELD_CLASS}
              defaultValue={listing.status}
            >
              {STATUSES_FOR_DISPLAY.map((s) => (
                <option key={s.value} value={s.value} disabled={s.disabled}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </aside>
    </div>
  )
}
