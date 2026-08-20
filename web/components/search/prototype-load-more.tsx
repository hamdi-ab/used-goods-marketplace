"use client"

import Link, { useLinkStatus } from "next/link"
import { Loader2Icon } from "lucide-react"

// PROTOTYPE — "Load more" link with a pending spinner (useLinkStatus from
// next/link). Gated by ?variant= and removed with the machinery.
export function PrototypeLoadMore({
  href,
  label = "Load more",
}: { href: string; label?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-sm font-medium underline">
      <LoadMoreStatus label={label} />
    </Link>
  )
}

function LoadMoreStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus()
  if (!pending) return label
  return (
    <>
      <Loader2Icon className="size-4 animate-spin" />
      {label === "Load more" ? "Loading more…" : "Loading…"}
    </>
  )
}