import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon, CameraIcon, SparklesIcon } from "lucide-react"

import { getCurrentUser } from "@/lib/auth"
import { fetchCategories } from "@/lib/listings"
import { fetchAccountUsage } from "@/lib/usage"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/home/header"
import { SiteFooter } from "@/components/home/footer"
import { CreateListingForm } from "@/components/listings/create-listing-form"
import { Button } from "@/components/ui/button"
import type { VariantKey } from "@/components/search/prototype-utils"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Sell an item",
  description: "Create a listing on the VinTech Marketplace.",
}

export async function PrototypeCreatePage({
  variant,
}: {
  variant: VariantKey
}) {
  // PROTOTYPE — the redesign variant (?variant=A|B, dev only). Signed-out reviewers see the empty state.
  const user = await getCurrentUser()

  if (!user) {
    return (
      <>
        <SiteHeader variant={variant} />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-4 rounded-2xl border p-10 py-20 text-center",
              variant === "B"
                ? "border-[#2563EB]/30 bg-[#EEF4FF]"
                : "border-border bg-muted/30"
            )}
          >
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-full",
                variant === "B" ? "bg-white/20" : "bg-muted"
              )}
            >
              <PlusIcon
                className={cn(
                  "size-7",
                  variant === "B" ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>
            <h2 className="font-heading text-xl font-semibold">
              Sign in to sell
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create an account or log in to start selling on VinTech Marketplace.
            </p>
            <div className="flex gap-3">
              <Button asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          </div>
        </main>
        <SiteFooter variant={variant} />
      </>
    )
  }

  const categories = await fetchCategories()
  const usage = await fetchAccountUsage(user.id)

  return (
    <>
      <SiteHeader variant={variant} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Sell an item
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              List your item once, reach buyers across Addis Ababa.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SparklesIcon className="size-4 text-primary" />
            <span>
              AI credits: {usage.aiGenerations.used}/
              {usage.aiGenerations.limit ?? "∞"}
            </span>
          </div>
        </div>

        <div
          className={cn(
            "rounded-2xl border p-6 shadow-sm sm:p-8",
            variant === "B" ? "border-[#2563EB]/20" : "border-border"
          )}
        >
          <CreateListingForm
            categories={categories}
            aiCredits={{
              used: usage.aiGenerations.used,
              limit: usage.aiGenerations.limit,
            }}
          />
        </div>
      </main>
      <SiteFooter variant={variant} />
    </>
  )
}
