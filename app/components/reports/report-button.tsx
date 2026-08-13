"use client"

import Link from "next/link"
import { useState } from "react"
import { FlagIcon } from "lucide-react"

import { buildLoginUrl } from "@/lib/reports/constants"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ReportDialog } from "@/components/reports/report-dialog"

type Target =
  | { type: "listing"; listingId: string }
  | { type: "seller"; sellerId: string }

export function ReportButton({
  target,
  signedIn,
}: {
  target: Target
  signedIn: boolean
}) {
  const [open, setOpen] = useState(false)

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FlagIcon className="mr-1.5 size-4" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <ReportDialog
          listingId={target.type === "listing" ? target.listingId : null}
          sellerId={target.type === "seller" ? target.sellerId : null}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
