"use client"

import { useActionState, useEffect, useRef, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { SparklesIcon, XIcon, UploadIcon } from "lucide-react"

import { createListing } from "@/app/actions/listings"
import { CONDITIONS, type Condition } from "@/lib/listings/constants"
import type { Category } from "@/lib/listings"
import { isAtCap } from "@/lib/plans/constants"
import { FIELD_CLASS, TEXTAREA_CLASS } from "@/lib/form-fields"
import { cn } from "@/lib/utils"
import { AiAssist } from "@/components/listings/ai-assist"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { VariantKey } from "@/components/search/prototype-utils"

function FieldError({ message }: { message: string | undefined }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

// PROTOTYPE — guided create-listing flow (moodboard #1): progress steps, AI card
// promoted out of the photo drop zone, condition as pills, sticky publish bar.
// Gated by variant prop; removed with the prototype machinery.
const STEPS = [
  { n: 1, label: "Photos & details", on: true },
  { n: 2, label: "Price & location", on: false },
  { n: 3, label: "Publish", on: false },
]

export function CreateListingForm({
  categories,
  variant,
  aiCredits,
}: {
  categories: Category[]
  variant?: VariantKey
  /** Live n/3 AI-credit count for the chip (T28). Resets on the 1st of the month. */
  aiCredits?: { used: number; limit: number | null }
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createListing, {})
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
    const files = Array.from(e.target.files ?? [])
    urlRefs.current.forEach((url) => URL.revokeObjectURL(url))
    urlRefs.current = []
    const urls = files.map((f) => URL.createObjectURL(f))
    urlRefs.current = urls
    setPreviews(urls)
    setPhotoFiles(files.filter((f) => f.size > 0))
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="ai_assisted" value={aiAssisted ? "on" : ""} />
      {variant ? (
        <input type="hidden" name="condition" value={condition} />
      ) : null}

      {variant ? (
        <ol className="mb-6 flex flex-wrap items-center gap-2">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium",
                s.on
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-background text-muted-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-xs font-bold",
                  s.on ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {s.n}
              </span>
              {s.label}
            </li>
          ))}
        </ol>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Photos *</CardTitle>
          <CardDescription>
            First photo is the cover. Up to 10 JPG/PNG/WebP images, 5 MB each.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex min-h-[120px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground transition hover:border-primary"
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
            <UploadIcon className="mb-2 size-6" />
            <span>{previews.length ? "Change photos" : "Click to upload"}</span>
          </div>
          {state.errors?.photos ? (
            <FieldError message={state.errors.photos[0]} />
          ) : null}
          {previews.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {previews.map((url, i) => (
                <div key={url} className="relative aspect-video w-full overflow-hidden rounded-md border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`photo ${i + 1}`} className="h-full w-full object-cover" />
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

      {variant ? (
        <Card className="mb-6 border-primary/40 bg-gradient-to-b from-primary/5 to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SparklesIcon className="size-4 text-primary" />
              AI listing assistant
              {aiCredits ? (
                <Badge
                  variant={isAtCap(aiCredits.used, aiCredits.limit) ? "default" : "secondary"}
                >
                  {aiCredits.used}/{aiCredits.limit ?? "∞"} credits
                </Badge>
              ) : null}
            </CardTitle>
            <CardDescription>
              Upload a photo or two — we&apos;ll draft your title, description,
              category &amp; keywords from them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {photoFiles.length > 0 ? (
              <AiAssist
                categories={categories}
                photos={photoFiles}
                title={title}
                description={description}
                onApply={(s) => {
                  setTitle(s.title)
                  setDescription(s.description)
                  if (s.categoryId) setCategoryId(s.categoryId)
                  if (s.condition) setCondition(s.condition)
                  setAiAssisted(true)
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Add photos above to unlock the AI draft.
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {photoFiles.length > 0 ? (
            <AiAssist
              categories={categories}
              photos={photoFiles}
              title={title}
              description={description}
              onApply={(s) => {
                setTitle(s.title)
                setDescription(s.description)
                if (s.categoryId) setCategoryId(s.categoryId)
                if (s.condition) setCondition(s.condition)
                setAiAssisted(true)
              }}
            />
          ) : null}
        </>
      )}

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
              {variant ? (
                <div className="flex flex-wrap gap-2 pt-1" role="radiogroup" aria-label="Condition">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={condition === c}
                      onClick={() => setCondition(c)}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        condition === c
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : (
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
              )}
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

      {variant ? (
        <div className="sticky bottom-0 -mx-4 border-t bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border sm:px-6">
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "Publishing…" : "Publish listing"}
          </Button>
        </div>
      ) : (
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Publishing…" : "Publish listing"}
        </Button>
      )}
    </form>
  )
}
