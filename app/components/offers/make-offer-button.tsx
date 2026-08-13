"use client"

import Link from "next/link"
import { useState } from "react"
import { usePathname } from "next/navigation"

import { buildLoginUrl } from "@/lib/offers/constants"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { OfferModal } from "@/components/offers/offer-modal"

export function MakeOfferButton({
  listingId,
  listingPrice,
  isOwner,
  available,
  signedIn,
}: {
  listingId: string
  listingPrice: number
  isOwner: boolean
  available: boolean
  signedIn: boolean
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // You cannot offer on your own listing (INV-005), and draft or sold listings
  // are not open to offers — even to a signed-out visitor, who must not get a
  // CTA that would dead-end at a sold listing.
  if (isOwner || !available) return null

  // Signed-out visitors get a CTA that routes through login (with a ?next=
  // back to this listing) instead of a form that would just redirect.
  if (!signedIn) {
    return (
      <Button asChild size="lg">
        <Link href={buildLoginUrl(pathname)}>Make an offer</Link>
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Make an offer</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <OfferModal
          listingId={listingId}
          listingPrice={listingPrice}
          onClose={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
