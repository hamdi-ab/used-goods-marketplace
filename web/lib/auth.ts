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

// T04: only sellers may create or edit listings. Admins are moderation-only
// (ADR-020): they no longer pass the seller gate, so /sell and listing
// edit/delete redirect an admin to the console (buyers go to /profile).
export async function requireSeller(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role === "admin") {
    redirect("/admin")
  }
  if (user.role !== "seller") {
    // Not a seller yet — land on /profile, where the "Start selling" nudge
    // (fix #71) promotes a buyer to seller; the redirected page re-renders
    // with the seller tools once the role flips.
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

// ADR-020: admins are moderation-only and do not trade (no selling, offering,
// favoriting, reviewing, contacting sellers, or filing community reports).
// Trader actions gate on this so an admin's writes are blocked server-side.
export async function requireTrader(): Promise<SessionUser> {
  const user = await requireUser()
  if (user.role === "admin") {
    redirect("/admin")
  }
  return user
}