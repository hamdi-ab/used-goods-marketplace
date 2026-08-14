import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { SessionUser, UserRole } from "./auth/types"

export type { SessionUser, UserRole }
export { ROLE_LABELS } from "./auth/types"

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, profile_completion")
    .eq("id", authUser.id)
    .maybeSingle()

  const role: UserRole = profile?.role === "admin" || profile?.role === "seller"
    ? profile.role
    : "buyer"

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    role,
    fullName: profile?.full_name ?? null,
    profileCompleted: (profile?.profile_completion ?? 0) >= 100,
  }
})

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

// T04: only sellers (and admins) may create or edit listings.
export async function requireSeller(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "seller" && user.role !== "admin") {
    // Not a seller yet — surface the profile page where this gate can be
    // surfaced as a future "become a seller" prompt.
    redirect("/profile")
  }
  return user
}

// T11: only admins may access the moderation queue.
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role !== "admin") {
    redirect("/dashboard")
  }
  return user
}