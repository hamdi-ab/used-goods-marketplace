"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

type Theme = "light" | "dark" | "system"

type ThemeProviderContextValue = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolved: "light" | "dark"
}

const ThemeProviderContext = createContext<ThemeProviderContextValue | null>(null)

const STORAGE_KEY = "dagim-theme"

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolved, setResolved] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  // Read persisted preference on mount (avoids hydration mismatch).
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored)
    }
    setMounted(true)
  }, [])

  // Resolve "system" to actual preference and apply to <html>.
  useEffect(() => {
    if (!mounted) return

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const resolve = () => {
      const effective =
        theme === "system" ? (media.matches ? "dark" : "light") : theme
      setResolved(effective)
      document.documentElement.classList.toggle("dark", effective === "dark")
    }

    resolve()
    media.addEventListener("change", resolve)
    return () => media.removeEventListener("change", resolve)
  }, [theme, mounted])

  const setTheme = (next: Theme) => {
    setThemeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  // Prevent FOUC: don't render children until mounted so the server and
  // client agree on the class list.
  if (!mounted) {
    return <div style={{ visibility: "hidden" }}>{children}</div>
  }

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolved }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeProviderContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
