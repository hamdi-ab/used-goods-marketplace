import { redirect } from "next/navigation"

import { PhoneVerification } from "@/components/auth/phone-verification"
import { requireUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export default async function PhoneVerificationPage() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("phone, phone_verified")
    .eq("id", user.id)
    .single()

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
      <a
        href="/profile"
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to profile
      </a>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Verify your phone number</h1>
        <p className="text-sm text-muted-foreground">
          Get a verified badge on your profile. This is optional — you can skip this step.
        </p>
        <PhoneVerification initialPhone={profile?.phone ?? ""} verified={profile?.phone_verified ?? false} />
        <div className="mt-2 flex justify-center">
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            Skip for now
          </a>
        </div>
      </div>
    </main>
  )
}
