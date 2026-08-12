import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type UserRole = "buyer" | "seller" | "admin"

export type SessionUser = {
  id: string
  email: string
  role: UserRole
  fullName: string | null
  profileCompleted: boolean
}

const ROLE_RANK: Record<UserRole, number> = {
  buyer: 1,
  seller: 2,
  admin: 3,
}

export function roleAtLeast(role: UserRole, min: UserRole) {
  return ROLE_RANK[role] >= ROLE_RANK[min]
}

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
    .single()

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

export async function requireRole(min: UserRole): Promise<SessionUser> {
  const user = await requireUser()
  if (!roleAtLeast(user.role, min)) redirect("/")
  return user
}