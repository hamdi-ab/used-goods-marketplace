"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  href: string
}

const buyerTabs: Tab[] = [
  { id: "offers", label: "My offers", href: "/activity?tab=offers" },
  { id: "favorites", label: "Favorites", href: "/activity?tab=favorites" },
  { id: "dashboard", label: "Dashboard", href: "/activity?tab=dashboard" },
]

const sellerTabs: Tab[] = [
  { id: "offers", label: "Incoming offers", href: "/activity?tab=offers" },
  { id: "listings", label: "My listings", href: "/activity?tab=listings" },
  { id: "dashboard", label: "Dashboard", href: "/activity?tab=dashboard" },
]

export function ActivityTabs() {
  const { role } = useAuth()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get("tab") ?? "offers"
  const tabs = role === "seller" ? sellerTabs : buyerTabs

  return (
    <div className="mb-6 border-b border-border overflow-x-auto no-scrollbar">
      <nav className="flex min-w-full gap-1 -mb-px" aria-label="Activity tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
