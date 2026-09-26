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
      <div className="border-b border-border mb-6">
        <nav className="flex gap-0 -mb-px" aria-label="Activity">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="tab-content" data-active-tab={activeTab}>
        {children}
      </div>
    </div>
  )
}
