"use client"

import { useState } from "react"
import { SparklesIcon, XIcon } from "lucide-react"

import type { Category } from "@/lib/listings/constants"
import type { AIListingSuggestion } from "@/lib/ai/constants"
import { generateListingSuggestionsAction } from "@/app/actions/ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface AiAssistProps {
  categories: Category[]
  /** The photos selected so far in the create-listing form. */
  photos: File[]
  /** The seller's already-typed title, forwarded as optional prompt context (FS-005 Inputs). */
  title?: string
  /** The seller's already-typed description, forwarded as optional prompt context (FS-005 Inputs). */
  description?: string
  /** Apply the accepted suggestion to the form's controlled fields. */
  onApply: (suggestion: AIListingSuggestion) => void
}

type AiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "unavailable"; message: string }
  | { phase: "ready"; suggestion: AIListingSuggestion }

// FS-005 "Every field remains editable" / NFR-AI-001: keywords are editable
// chips (remove on click, add with Enter) before the seller accepts. Keywords
// stay an AI-output field — the listing schema has no keywords column (DB spec
// §8; Module 6 search sources are title/description/category/location) — so
// editing here refines the suggestion without persisting dead data.
function KeywordEditor({ initial }: { initial: string[] }) {
  const [keywords, setKeywords] = useState<string[]>(initial)
  const [draft, setDraft] = useState("")

  function add() {
    const k = draft.trim()
    if (k && !keywords.includes(k)) setKeywords((ks) => [...ks, k])
    setDraft("")
  }

  return (
    <div>
      <p className="text-sm font-medium">Keywords</p>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs"
          >
            {k}
            <button
              type="button"
              aria-label={`Remove keyword ${k}`}
              onClick={() => setKeywords((ks) => ks.filter((x) => x !== k))}
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              add()
            }
          }}
          aria-label="Add keyword"
          placeholder="Add tag…"
          className="w-24 rounded-full border border-input bg-transparent px-2.5 py-0.5 text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

export function AiAssist({
  categories,
  photos,
  title,
  description,
  onApply,
}: AiAssistProps) {
  const [state, setState] = useState<AiState>({ phase: "idle" })
  const canRun = photos.length > 0 && state.phase !== "loading"

  async function run(mode: "generate" | "regenerate" = "generate") {
    setState({ phase: "loading" })
    const fd = new FormData()
    for (const f of photos) fd.append("photos", f)
    fd.append("categories", JSON.stringify(categories))
    fd.append("ai_event", mode)
    if (title) fd.append("title", title)
    if (description) fd.append("description", description)
    const res = await generateListingSuggestionsAction({}, fd)

    if (res.ok && res.suggestion) {
      setState({ phase: "ready", suggestion: res.suggestion })
    } else {
      // unavailable / rate_limited / degraded all mean "manual listing remains
      // available" (AC-3) — one message path, no config details leaked.
      setState({ phase: "unavailable", message: res.message ?? "AI unavailable" })
    }
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => run()}
        disabled={!canRun}
      >
        <SparklesIcon className="mr-2 size-4" />
        {state.phase === "loading" ? "Generating…" : "AI Assist"}
      </Button>

      {state.phase === "unavailable" ? (
        <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
      ) : null}

      {state.phase === "ready" ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">AI suggestions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium">Title</p>
              <p className="text-sm">{state.suggestion.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm">{state.suggestion.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm">{state.suggestion.categoryName ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Condition</p>
                <p className="text-sm">{state.suggestion.condition ?? "—"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Quality</p>
                <p className="text-sm">{state.suggestion.qualityScore}/100</p>
              </div>
            </div>
            <KeywordEditor
              key={state.suggestion.keywords.join(",")}
              initial={state.suggestion.keywords}
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onApply(state.suggestion)
                  setState({ phase: "idle" })
                }}
              >
                Apply to form
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => run("regenerate")}
              >
                Regenerate
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setState({ phase: "idle" })}
              >
                Dismiss
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Suggestions are editable — accepting them only pre-fills the fields;
              the listing is never published automatically.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}