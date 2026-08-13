"use client"

import { useActionState } from "react"
import { XIcon } from "lucide-react"

import { updateListing, deleteListing } from "@/app/actions/listings"
import { CONDITIONS, STATUSES_FOR_DISPLAY } from "@/lib/listings/constants"
import type { Category, Listing } from "@/lib/listings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function EditListingForm({
  listing,
  categories,
}: {
  listing: Listing
  categories: Category[]
}) {
  const [state, formAction, pending] = useActionState(updateListing, {})
  const [deleteState, deleteAction, deletePending] = useActionState(deleteListing, {})

  return (
    <>
      <form action={formAction} id="edit-listing-form">
        <input type="hidden" name="id" value={listing.id} readOnly />

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                defaultValue={listing.title}
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
                className="resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring/50"
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
                  defaultValue={listing.price}
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
                        defaultChecked={listing.condition === c}
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
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
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
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
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
                defaultChecked={listing.negotiable}
                className="accent-primary"
              />
              Price is negotiable
            </label>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              name="status"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/50"
              defaultValue={listing.status}
            >
              {STATUSES_FOR_DISPLAY.map((s) => (
                <option key={s.value} value={s.value} disabled={s.disabled}>
                  {s.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
        {state.ok ? <p className="text-sm text-green-600">Listing updated.</p> : null}

        <div className="mt-4 flex gap-3">
          <Button type="submit" form="edit-listing-form" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
          <Button
            type="submit"
            form="delete-listing-form"
            variant="destructive"
            disabled={deletePending}
            onClick={() => {
              if (
                !confirm("Archive this listing? It will no longer be visible.")
              )
                return false
            }}
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
          if (
            !confirm("Archive this listing? It will no longer be visible.")
          )
            e.preventDefault()
        }}
      >
        <input type="hidden" name="id" value={listing.id} readOnly />
      </form>

      {deleteState.message ? (
        <p className="text-sm text-destructive">{deleteState.message}</p>
      ) : null}
    </>
  )
}
