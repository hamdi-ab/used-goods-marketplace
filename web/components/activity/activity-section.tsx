"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
}

const buyerTabs: Tab[] = [
  { id: "offers", label: "My offers" },
  { id: "favorites", label: "Favorites" },
  { id: "dashboard", label: "Dashboard" },
]

const sellerTabs: Tab[] = [
  { id: "offers", label: "Incoming offers" },
  { id: "listings", label: "My listings" },
  { id: "dashboard", label: "Dashboard" },
]

export function ActivitySection({ children }: { children: React.ReactNode }) {
  const { role } = useAuth()
  const tabs = role === "seller" ? sellerTabs : buyerTabs
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div>
      <div className="mb-6 border-b border-border overflow-x-auto no-scrollbar">
        <nav className="flex min-w-full gap-1 -mb-px" aria-label="Activity" role="tablist">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-t-lg px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 min-h-[44px]",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>
      <div className="tab-content" data-active-tab={activeTab}>
        {children}
      </div>
    </div>
  )
}
