"use client"

import { useCallback, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PROTOTYPE_VARIANTS, PROTOTYPE_KEYS } from "./variants"

// PROTOTYPE — floating variant switcher for the trust-surfacing prototype
// (issue #101). Mirrors the home-page prototype switcher; gated to dev.

const VARIANTS = PROTOTYPE_KEYS

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  const tag = el.tagName
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  )
}

export function TrustPrototypeSwitcher() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const current = searchParams.get("variant") ?? "A"
  const safeCurrent = VARIANTS.includes(current) ? current : "A"

  const switchTo = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("variant", key)
      router.replace(`/prototype/trust?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const step = useCallback(
    (delta: number) => {
      const idx = VARIANTS.indexOf(safeCurrent)
      const next = VARIANTS[(idx + delta + VARIANTS.length) % VARIANTS.length]
      switchTo(next)
    },
    [safeCurrent, switchTo]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        step(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        step(1)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step])

  const label = PROTOTYPE_VARIANTS.find((v) => v.key === safeCurrent)?.name

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-foreground/20 bg-foreground px-2 py-1.5 text-sm text-background shadow-xl">
      <button
        type="button"
        onClick={() => step(-1)}
        aria-label="Previous variant"
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-background/10"
      >
        <ChevronLeft className="size-4" />
      </button>
      <span className="px-3 font-medium">
        {safeCurrent} — {label}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        aria-label="Next variant"
        className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-background/10"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}