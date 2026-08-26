import "server-only"

import { redirect } from "next/navigation"
import { unstable_cache } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import type { SessionUser, UserRole } from "./auth/types"
import { resolveTier } from "./plans/constants"

export type { SessionUser, UserRole }
export { ROLE_LABELS } from "./auth/types"

export const getCurrentUser = async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  return unstable_cache(
    async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role, tier, profile_completion")
        .eq("id", authUser.id)
        .maybeSingle()

      const role: UserRole = profile?.role === "admin" || profile?.role === "seller"
        ? profile.role
        : "buyer"

      return {
        id: authUser.id,
        email: authUser.email ?? "",
        role,
        tier: resolveTier(profile?.tier ?? null),
        fullName: profile?.full_name ?? null,
        profileCompleted: (profile?.profile_completion ?? 0) >= 100,
      }
    },
    [`user-${authUser.id}`],
    { revalidate: 10, tags: [`user-${authUser.id}`] }
  )()
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function requireSeller(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role === "admin") {
    redirect("/admin")
  }
  if (user.role !== "seller") {
    redirect("/profile")
  }
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "admin") {
    redirect("/dashboard")
  }
  return user
}

export async function requireTrader(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role === "admin") {
    redirect("/admin")
  }
  return user
}
