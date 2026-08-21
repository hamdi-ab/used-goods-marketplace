import type { Metadata } from "next"
import type { ReactNode } from "react"
import Link from "next/link"

import { getCurrentUser } from "@/lib/auth"
import { FIELD_CLASS } from "@/lib/form-fields"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PrototypeHeader } from "@/components/home/prototype/prototype-header"
import { PrototypeFooter } from "@/components/home/prototype/prototype-footer"
import { withVariant, type VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Finish setting up your account",
  description: "Complete your VinTech Marketplace profile.",
}

const TRUST: { title: string; body: string }[] = [
  { title: "Phone + Fayda ID verification", body: "Buyers and sellers know who they deal with." },
  { title: "Public reviews & trust score", body: "Your reputation travels with your profile." },
  { title: "Safe local meetups", body: "Trade face to face in public places." },
]

// PROTOTYPE — onboarding redesign, "Split Welcome": a navy brand panel on the
// left (what the marketplace is for + trust) and the profile form on the right.
// The onboarding state is naturally empty, so the layout renders as-is for any
// reviewer (real pre-filled full name when signed in). View-only during review:
// inputs are inert and nothing submits.
export async function PrototypeOnboardingPage({
  variant,
}: {
  variant: VariantKey
}) {
  const user = await getCurrentUser()

  const input = (
    props: React.InputHTMLAttributes<HTMLInputElement>
  ) => (
    <input {...props} readOnly className={cn(FIELD_CLASS, "read-only:opacity-70")} />
  )

  const group = (title: string, children: ReactNode) => (
    <fieldset className="flex flex-col gap-4">
      <legend className="font-heading text-sm font-semibold text-foreground">
        {title}
      </legend>
      {children}
    </fieldset>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <PrototypeHeader variant={variant} />
      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* Brand panel */}
          <div
            className={cn(
              "flex flex-col justify-between gap-10 rounded-2xl p-8 text-white sm:p-10",
              variant === "B"
                ? "bg-gradient-to-br from-[#1d4ed8] via-[#1e40af] to-[#172554]"
                : "bg-[#172554]"
            )}
          >
            <div>
              <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold backdrop-blur">
                V
              </div>
              <h1 className="font-heading text-2xl font-semibold leading-tight">
                You&apos;re one step from trading.
              </h1>
              <p className="mt-3 max-w-sm text-sm text-white/80">
                Finish your profile so buyers and sellers know who they&apos;re
                dealing with. You can change these details any time from your
                profile.
              </p>
            </div>

            <ul className="flex flex-col gap-4">
              {TRUST.map((t) => (
                <li key={t.title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs">
                    ✓
                  </span>
                  <span>
                    <p className="text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-white/75">{t.body}</p>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Form panel */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-foreground">
              Finish setting up your account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tell buyers and sellers a little about you.
            </p>

            <div className="mt-6 flex flex-col gap-6">
              {group(
                "About you",
                <>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="p-fullName" className="text-sm font-medium">
                      Full name *
                    </label>
                    {input({ id: "p-fullName", value: user?.fullName ?? "" })}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="p-city" className="text-sm font-medium">
                        City *
                      </label>
                      {input({
                        id: "p-city",
                        placeholder: "e.g. Addis Ababa",
                      })}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="p-subCity" className="text-sm font-medium">
                        Sub-city
                      </label>
                      {input({ id: "p-subCity", placeholder: "e.g. Bole" })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="p-bio" className="text-sm font-medium">
                      Bio
                    </label>
                    {input({
                      id: "p-bio",
                      placeholder: "A short introduction (optional)",
                    })}
                  </div>
                </>
              )}

              {group(
                "Contact",
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="p-phone" className="text-sm font-medium">
                        Phone
                      </label>
                      {input({
                        id: "p-phone",
                        type: "tel",
                        inputMode: "tel",
                        placeholder: "+251 91 234 5678",
                      })}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label htmlFor="p-telegram" className="text-sm font-medium">
                        Telegram username
                      </label>
                      {input({
                        id: "p-telegram",
                        placeholder: "@yourname",
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-3 border-t pt-5">
                <Button
                  type="button"
                  disabled
                  className="h-11"
                  title="Prototype preview — nothing is saved yet"
                >
                  Save profile
                </Button>
                <Link
                  href={withVariant("/profile", variant)}
                  className="text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PrototypeFooter variant={variant} flush />
    </div>
  )
}