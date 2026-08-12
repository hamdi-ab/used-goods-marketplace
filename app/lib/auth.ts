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

export const ROLE_LABELS: Record<UserRole, string> = {
  buyer: "Buyer",
  seller: "Seller",
  admin: "Admin",
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