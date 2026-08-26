"use client"

import { useActionState, useEffect, useRef, useState, useTransition, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { XIcon, UploadIcon } from "lucide-react"

import { createListing } from "@/app/actions/listings"
import { CONDITIONS, type Condition } from "@/lib/listings/constants"
import type { Category } from "@/lib/listings"
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/form-fields"
import { AiAssist } from "@/components/listings/ai-assist"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

export function CreateListingForm({
  categories,
  aiCredits,
}: {
  categories: Category[]
  /** Live n/3 AI-credit count for the chip (T28). Resets on the 1st of the month. */
  aiCredits?: { used: number; limit: number | null }
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createListing, {})
  const [isPending, startTransition] = useTransition()
  const [previews, setPreviews] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const urlRefs = useRef<string[]>([])

  // T14: the AI-fillable fields are controlled so the assistant can pre-fill
  // them (editable, never auto-submitted). The native form still posts their
  // DOM values on submit.
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  // "" is the unselected radio state — a real Condition value, never a cast lie.
  const [condition, setCondition] = useState<Condition | "">("")
  const [aiAssisted, setAiAssisted] = useState(false)

  useEffect(() => {
    return () => {
      urlRefs.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    if (state.ok && state.listingId) {
      router.replace(`/listings/${state.listingId}`)
    }
  }, [state, router])

  function handlePhotos(e: ChangeEvent<HTMLInputElement>) {
    const newFiles = Array.from(e.target.files ?? []).filter((f) => f.size > 0)
    if (newFiles.length === 0) return

    const remaining = 10 - photoFiles.length
    const toAdd = newFiles.slice(0, remaining)

    const newUrls = toAdd.map((f) => URL.createObjectURL(f))
    urlRefs.current.push(...newUrls)
    setPreviews((p) => [...p, ...newUrls])
    setPhotoFiles((p) => [...p, ...toAdd])

    // Clear input so re-selecting the same files fires onChange again
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const formData = new FormData(e.currentTarget)
        formData.delete("photos")
        photoFiles.forEach((f) => formData.append("photos", f))
        startTransition(() => {
          formAction(formData)
        })
        e.preventDefault()
      }}
    >
      <input type="hidden" name="ai_assisted" value={aiAssisted ? "on" : ""} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Photos *</CardTitle>
          <CardDescription>
            First photo is the cover. Up to 10 JPG/PNG/WebP images, 5 MB each.
            {previews.length > 0 ? ` (${previews.length}/10 added)` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground transition hover:border-primary"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              name="photos"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="hidden"
              onChange={handlePhotos}
              aria-label="upload photos"
            />
            {previews.length > 0 ? (
              <>
                <UploadIcon className="size-6" />
                <span className="font-medium text-foreground">Add more photos</span>
                <span className="text-xs text-muted-foreground">
                  {10 - previews.length} remaining
                </span>
              </>
            ) : (
              <>
                <UploadIcon className="mb-2 size-6" />
                <span>Click to upload</span>
              </>
            )}
          </div>
          {state.errors?.photos ? (
            <FieldError message={state.errors.photos[0]} />
          ) : null}
          {previews.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.map((url, i) => (
                <div key={`${i}-${url}`} className="relative aspect-video w-full overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(url)
                      setPreviews((p) => p.filter((_, idx) => idx !== i))
                      setPhotoFiles((p) => p.filter((_, idx) => idx !== i))
                    }}
                    aria-label={`Remove photo ${i + 1}`}
                    className="absolute right-1 top-1 rounded bg-background/80 p-0.5"
                  >
                    <XIcon className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {photoFiles.length > 0 ? (
        <AiAssist
          categories={categories}
          photos={photoFiles}
          title={title}
          description={description}
          credits={aiCredits}
          onApply={(s) => {
            setTitle(s.title)
            setDescription(s.description)
            if (s.categoryId) setCategoryId(s.categoryId)
            if (s.condition) setCondition(s.condition)
            setAiAssisted(true)
          }}
        />
      ) : null}

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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              aria-invalid={!!state.errors?.title}
            />
            <FieldError message={state.errors?.title?.[0]} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className={TEXTAREA_CLASS}
              placeholder="Include condition, brand, age, what's included..."
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
                placeholder="0.00"
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
              value={categoryId ?? ""}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className={FIELD_CLASS}
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

      <Card className="mb-8">
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
                placeholder="e.g. Addis Ababa"
                aria-invalid={!!state.errors?.city}
              />
              <FieldError message={state.errors?.city?.[0]} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="subCity">Sub-city / neighborhood</Label>
              <Input
                id="subCity"
                name="subCity"
                placeholder="e.g. Bole"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              name="address"
              placeholder="Street address or landmark"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="negotiable" className="accent-primary" />
            Price is negotiable
          </label>
        </CardContent>
      </Card>

      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Publishing…" : "Publish listing"}
      </Button>
    </form>
  )
}
