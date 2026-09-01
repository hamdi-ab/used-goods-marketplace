import { useEffect, useState } from "react"

/** Debounce a value by `ms`, returning the held value until it settles.
 * Used by #79 to batch rapid filter edits into a single URL push. (§14: small,
 * focused, pure-ish seam.) */
export function useDebounce<T>(value: T, ms: number): T {
  const [held, setHeld] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setHeld(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return held
}
