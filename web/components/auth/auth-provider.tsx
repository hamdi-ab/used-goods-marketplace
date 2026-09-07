"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/auth/types"
import { fetchClientRole } from "@/lib/auth/client-role"

type AuthContextValue = {
  user: User | null
  role: UserRole | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Resolve the role alongside the user so the header/menu never render a
    // wrong (trader) branch for an admin mid-load — loading stays true until
    // both are known.
    void (async () => {
      const { data } = await supabase.auth.getUser()
      const nextUser = data.user ?? null
      setUser(nextUser)

      if (!nextUser) {
        setRole(null)
        setLoading(false)
        return
      }

      try {
        setRole(await fetchClientRole(supabase, nextUser.id))
      } catch (e) {
        console.error("Failed to fetch role", e)
        setRole(null)
      } finally {
        setLoading(false)
      }
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setRole(null)
      setLoading(false)
      router.refresh()
    })

    return () => subscription.unsubscribe()
  }, [router])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
