"use client"

import dynamic from "next/dynamic"
import type { ComponentType } from "react"

/**
 * Lazy-load a dialog/form component when its dialog opens, so the heavy form
 * code never ships in the initial bundle (T15 code splitting). Usage:
 * `const OfferModal = lazyDialog(() => import("./offer-modal").then(m => m.OfferModal))`
 */
export function lazyDialog<TProps extends object>(
  loader: () => Promise<ComponentType<TProps>>
): ComponentType<TProps> {
  return dynamic(() => loader(), { ssr: false })
}
