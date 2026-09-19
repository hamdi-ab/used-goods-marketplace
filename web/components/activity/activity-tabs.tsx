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
    <div className="border-b border-border mb-6">
      <nav className="flex gap-0 -mb-px" aria-label="Activity">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
