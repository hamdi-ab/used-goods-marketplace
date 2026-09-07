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

function isValidTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolved, setResolved] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isValidTheme(stored) && stored !== theme) {
        setThemeState(stored)
      }
    }
    setMounted(true)
  }, [theme])

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
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, next)
    }
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

// Safe variant for components rendered outside the provider (e.g. ThemeToggle
// during static generation of pages like /sell and /about that don't yet
// have a client ThemeProvider in scope). Returns safe defaults on the server.
export function useThemeOrDefault() {
  const ctx = useContext(ThemeProviderContext)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (ctx) {
    return { ...ctx, mounted }
  }

  return {
    theme: "system" as Theme,
    setTheme: () => {},
    resolved: "light" as const,
    mounted,
  }
}
