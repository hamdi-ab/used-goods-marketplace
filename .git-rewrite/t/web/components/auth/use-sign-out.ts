"use client"

import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

export function useSignOut() {
  const router = useRouter()

  async function signOut(next = "/") {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.refresh()
      router.push(next)
    } catch (error) {
      console.error("Sign out failed", error)
    }
  }

  return signOut
}