"use client"

import { useEffect, useRef } from "react"

import { recordListingView } from "@/lib/listings/client-view"

/**
 * Records one view per listing-detail visit (fix #74). Rendered by the server
 * page; fires exactly once per mounted listing id — a ref dedupes React
 * StrictMode's double-effect and id changes — then hands off to the idempotent
 * record_listing_view RPC, so the counter is never inflated per render.
 */
export function ListingViewTracker({ listingId }: { listingId: string }) {
  const firedFor = useRef<string | null>(null)

  useEffect(() => {
    if (firedFor.current === listingId) return
    firedFor.current = listingId
    void recordListingView(listingId)
  }, [listingId])

  return null
}
