"use server"

import { createClient } from "@/lib/supabase/server"

export interface BusinessLeadRow {
  id: string
  name: string
  email: string
  phone: string | null
  company: string | null
  needs: string | null
  status: string
  created_at: string
}

export async function fetchBusinessLeads(): Promise<BusinessLeadRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("business_leads")
    .select("id, name, email, phone, company, needs, status, created_at")
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    console.error("fetchBusinessLeads:", error.message)
    return []
  }
  return (data ?? []) as BusinessLeadRow[]
}
