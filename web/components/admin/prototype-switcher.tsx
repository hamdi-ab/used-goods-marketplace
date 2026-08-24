"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const variants = [
  { key: "A", label: "Rail", desc: "Collapsible icon + label" },
  { key: "B", label: "Grouped", desc: "Section headers" },
  { key: "C", label: "Dock", desc: "Bottom icon bar" },
] as const

export function AdminPrototypeSwitcher() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("variant") ?? "B"

  const buildHref = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("variant", key)
    return `${pathname}?${params.toString()}`
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-2 shadow-lg">
        {variants.map((v) => (
          <Link
            key={v.key}
            href={buildHref(v.key)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              current === v.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span className="font-semibold">{v.key}</span>
            <span className="hidden sm:inline">— {v.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
