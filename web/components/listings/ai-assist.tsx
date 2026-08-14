"use client"

import { useState } from "react"
import { SparklesIcon } from "lucide-react"

import type { Category } from "@/lib/listings/constants"
import type { AIListingSuggestion } from "@/lib/ai/constants"
import { generateListingSuggestionsAction } from "@/app/actions/ai"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface AiAssistProps {
  categories: Category[]
  /** The photos selected so far in the create-listing form. */
  photos: File[]
  /** Apply the accepted suggestion to the form's controlled fields. */
  onApply: (suggestion: AIListingSuggestion) => void
}

type AiState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "unavailable"; message: string }
  | { phase: "error"; message: string }
  | { phase: "ready"; suggestion: AIListingSuggestion }

export function AiAssist({ categories, photos, onApply }: AiAssistProps) {
  const [state, setState] = useState<AiState>({ phase: "idle" })
  const canRun = photos.length > 0 && state.phase !== "loading"

  async function run() {
    setState({ phase: "loading" })
    const fd = new FormData()
    for (const f of photos) fd.append("photos", f)
    fd.append("categories", JSON.stringify(categories))
    const res = await generateListingSuggestionsAction({}, fd)

    if (res.ok && res.suggestion) {
      setState({ phase: "ready", suggestion: res.suggestion })
    } else if (res.reason === "rate_limited" || res.reason === "unavailable") {
      setState({ phase: "unavailable", message: res.message ?? "AI unavailable" })
    } else {
      setState({
        phase: "unavailable",
        message: res.message ?? "AI unavailable",
      })
    }
  }

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={run}
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
            <div className="grid grid-cols-2 gap-4 text-sm">
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
              <div>
                <p className="text-sm font-medium">Keywords</p>
                <p className="text-sm">{state.suggestion.keywords.join(", ")}</p>
              </div>
            </div>
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
              <Button type="button" size="sm" variant="ghost" onClick={run}>
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
