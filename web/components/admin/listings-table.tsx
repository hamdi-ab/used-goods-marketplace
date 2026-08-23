"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { SearchIcon, ListIcon } from "lucide-react"

import type { AdminListingRow } from "@/lib/admin"
import { formatPrice } from "@/lib/listings/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ListingsTableProps {
  listings: AdminListingRow[]
  count: number
}

const STATUS_OPTIONS = ["published", "draft", "archived"]

export function ListingsTable({ listings, count }: ListingsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get("search") ?? ""
  const currentStatus = searchParams.get("status") ?? ""

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete("offset")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname)
    })
  }

  const hasFilters = currentSearch || currentStatus

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search listings by title..."
            defaultValue={currentSearch}
            onChange={(e) => updateParam("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => updateParam("status", currentStatus === status ? "" : status)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                currentStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        {hasFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isPending}>
            Clear
          </Button>
        ) : null}
      </div>

      {/* Count */}
      <p className="mb-3 text-sm text-muted-foreground">
        {count} listing{count === 1 ? "" : "s"}
        {hasFilters ? " matching filters" : ""}
      </p>

      {/* Table */}
      {listings.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-16 text-center">
          <ListIcon className="size-10 text-muted-foreground/60" />
          <h2 className="font-heading text-lg font-semibold">No listings found</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "When sellers publish listings, they will appear here for moderation."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">Listing</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Condition</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {listings.map((listing) => {
                const sold = listing.sold_to_buyer_id !== null
                return (
                  <tr key={listing.id} className="text-sm transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                          {listing.images?.[0] ? (
                            <Image
                              src={listing.images[0].image_url}
                              alt={listing.title}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[0.6rem] text-muted-foreground">
                              No photo
                            </div>
                          )}
                        </div>
                        <a
                          href={`/listings/${listing.id}`}
                          className="line-clamp-1 max-w-[200px] font-medium text-foreground hover:underline"
                        >
                          {listing.title}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-foreground">{formatPrice(listing.price)}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{listing.condition ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{listing.status}</Badge>
                      {sold ? (
                        <Badge variant="secondary" className="ml-1.5">Sold</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{listing.seller?.full_name ?? "Unknown"}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{listing.view_count ?? 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
