"use client"

import { useState } from "react"
import { SparklesIcon, XIcon, RefreshCwIcon, CheckCircle2Icon } from "lucide-react"

import type { Category } from "@/lib/listings/constants"
import type { AIListingSuggestion } from "@/lib/ai/constants"
import { generateListingSuggestionsAction } from "@/app/actions/ai"
import { isAtCap } from "@/lib/plans/constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface AiAssistProps {
  categories: Category[]
  photos: File[]
  title?: string
  description?: string
  onApply: (suggestion: AIListingSuggestion) => void
  credits?: { used: number; limit: number | null }
}

type AiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "unavailable"; message: string }
  | { phase: "ready"; suggestion: AIListingSuggestion }

function QualityMeter({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const color =
    pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-muted-foreground/30"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums text-foreground">{score}/100</span>
    </div>
  )
}

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
      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
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
          className="h-7 w-28 rounded-full border border-input bg-transparent px-3 text-xs outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
        />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <div className="h-3 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-1.5">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
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
  credits,
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
      setState({ phase: "unavailable", message: res.message ?? "AI unavailable" })
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <SparklesIcon className="size-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">AI listing assistant</p>
            <p className="text-xs text-muted-foreground">
              Upload photos to auto-fill title, description, and category.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {credits ? (
            <Badge
              variant={isAtCap(credits.used, credits.limit) ? "default" : "secondary"}
              className="gap-1"
            >
              <SparklesIcon className="size-3" />
              <span className="text-xs">
                AI credits: {credits.used}/{credits.limit ?? "∞"}
              </span>
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => run()}
            disabled={!canRun}
          >
            <SparklesIcon className="mr-1.5 size-3.5" />
            {state.phase === "loading" ? "Generating…" : "Generate with AI"}
          </Button>
        </div>
      </div>

      {state.phase === "unavailable" ? (
        <p className="mt-3 text-sm text-muted-foreground">{state.message}</p>
      ) : null}

      {state.phase === "loading" ? (
        <div className="mt-4">
          <SkeletonRow />
        </div>
      ) : null}

      {state.phase === "ready" ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Title
              </p>
              <p className="mt-0.5 text-sm font-medium">{state.suggestion.title}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Category
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {state.suggestion.categoryName ?? "—"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Description
            </p>
            <p className="mt-0.5 text-sm leading-relaxed">
              {state.suggestion.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Condition
              </p>
              <p className="mt-0.5 text-sm font-medium">
                {state.suggestion.condition ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quality score
              </p>
              <div className="mt-1">
                <QualityMeter score={state.suggestion.qualityScore} />
              </div>
            </div>
          </div>

          <KeywordEditor
            key={state.suggestion.keywords.join(",")}
            initial={state.suggestion.keywords}
          />

          <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onApply(state.suggestion)
                setState({ phase: "idle" })
              }}
            >
              <CheckCircle2Icon className="mr-1.5 size-3.5" />
              Use suggestions
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => run("regenerate")}
            >
              <RefreshCwIcon className="mr-1.5 size-3.5" />
              Regenerate
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setState({ phase: "idle" })}
            >
              Dismiss
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Suggestions are editable — accepting them only pre-fills the fields;
            the listing is never published automatically.
          </p>
        </div>
      ) : null}
    </div>
  )
}
