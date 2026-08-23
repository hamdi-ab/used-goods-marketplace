"use client"

import { useState, useTransition, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, SlidersHorizontalIcon, XIcon, Loader2Icon } from "lucide-react"

import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { CONDITIONS, KNOWN_CITY_LABELS, type Category, type Condition } from "@/lib/listings/constants"
import { buildSearchUrl, SORT_LABELS, type SearchQuery } from "@/lib/search"

const DEBOUNCE_MS = 300

export function SearchControls({
  categories,
  filters,
  count,
}: {
  categories: Category[]
  filters: SearchQuery
  count: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [q, setQ] = useState(filters.q)
  const [condition, setCondition] = useState<Condition | "">(filters.condition ?? "")
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? "")
  const [city, setCity] = useState(filters.city)
  const [sellerVerified, setSellerVerified] = useState(filters.sellerVerified)
  const [sort, setSort] = useState(filters.sort)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const debouncedQ = useDebounce(q, DEBOUNCE_MS)

  const pushQuery = useCallback(() => {
    const url = buildSearchUrl({
      ...filters,
      q: debouncedQ,
      categorySlug: filters.categorySlug,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      condition: condition || undefined,
      city,
      sellerVerified,
      sort,
      offset: 0,
    })
    startTransition(() => router.push(url))
  }, [debouncedQ, minPrice, maxPrice, condition, city, sellerVerified, sort, filters, router])

  useEffect(() => {
    pushQuery()
  }, [debouncedQ, condition, minPrice, maxPrice, city, sellerVerified, sort, pushQuery])

  const activeFilters = [
    filters.categorySlug ? categories.find(c => c.slug === filters.categorySlug)?.name : null,
    condition ? CONDITIONS[condition] : null,
    city ? KNOWN_CITY_LABELS[city] ?? city : null,
    minPrice ? `Min ${minPrice} ETB` : null,
    maxPrice ? `Max ${maxPrice} ETB` : null,
    sellerVerified ? "Verified only" : null,
  ].filter(Boolean)

  const clearFilters = () => {
    setQ("")
    setCondition("")
    setMinPrice("")
    setMaxPrice("")
    setCity(undefined)
    setSellerVerified(false)
    setSort("newest")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search listings..."
            className="pl-10"
          />
          {pending ? (
            <Loader2Icon className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          ) : null}
        </div>

        <div className="flex gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontalIcon className="size-4" />
                Filters
                {activeFilters.length > 0 ? (
                  <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-[10px]">
                    {activeFilters.length}
                  </Badge>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={condition} onValueChange={(v) => setCondition(v as Condition | "")}>
                    <SelectTrigger id="condition">
                      <SelectValue placeholder="Any condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {Object.entries(CONDITIONS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">City</Label>
                  <Select value={city} onValueChange={(v) => setCity(v)}>
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Any city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any</SelectItem>
                      {Object.entries(KNOWN_CITY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="minPrice">Min price</Label>
                    <Input
                      id="minPrice"
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="ETB"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="maxPrice">Max price</Label>
                    <Input
                      id="maxPrice"
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="ETB"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={sellerVerified}
                    onChange={(e) => setSellerVerified(e.target.checked)}
                    className="size-4 rounded border-border accent-primary"
                  />
                  Verified sellers only
                </label>

                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Clear filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sort} onValueChange={(v) => setSort(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((f) => (
            <Badge key={f} variant="secondary" className="gap-1">
              {f}
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 gap-1 text-xs">
            <XIcon className="size-3" />
            Clear all
          </Button>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">
        {count} {count === 1 ? "listing" : "listings"}
      </p>
    </div>
  )
}
