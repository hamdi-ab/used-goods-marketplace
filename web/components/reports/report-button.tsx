"use client"

import Link from "next/link"
import { useState } from "react"
import { FlagIcon } from "lucide-react"

import { buildLoginUrl } from "@/lib/reports/constants"
import { lazyDialog } from "@/lib/lazy-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

// T15: load the report form only when the dialog opens (code splitting).
const ReportDialog = lazyDialog(() =>
  import("@/components/reports/report-dialog").then((m) => m.ReportDialog)
)

type Target =
  | { type: "listing"; listingId: string }
  | { type: "seller"; sellerId: string }

export function ReportButton({
  target,
  signedIn,
  isOwner,
}: {
  target: Target
  signedIn: boolean
  /** The signed-in user is the listed seller; owners cannot report themselves. */
  isOwner?: boolean
}) {
  const [open, setOpen] = useState(false)
  // Incrementing the key on each open forces ReportDialog to remount, which
  // resets its useActionState — otherwise a successful submission's state
  // persists and the "report received" view shows on every reopen.
  const [openKey, setOpenKey] = useState(0)

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (nextOpen) setOpenKey((k) => k + 1)
  }

  // A seller cannot report their own listing.
  if (isOwner) return null

  const label = target.type === "listing" ? "Report listing" : "Report seller"
  const href =
    target.type === "listing"
      ? `/listings/${target.listingId}`
      : `/users/${target.sellerId}`

  // Signed-out visitors route through login (with a ?next= back to the page).
  if (!signedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href={buildLoginUrl(href)}>
          <FlagIcon className="mr-1.5 size-4" />
          {label}
        </Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlagIcon className="mr-1.5 size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <ReportDialog
          key={openKey}
          listingId={target.type === "listing" ? target.listingId : null}
          sellerId={target.type === "seller" ? target.sellerId : null}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
