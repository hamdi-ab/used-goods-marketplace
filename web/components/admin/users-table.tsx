"use client"

import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, UsersIcon } from "lucide-react"

import type { AdminUserRow } from "@/lib/admin"
import { ROLE_LABELS } from "@/lib/auth/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { initials } from "@/lib/utils"

interface UsersTableProps {
  users: AdminUserRow[]
  count: number
}

export function UsersTable({ users, count }: UsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentSearch = searchParams.get("search") ?? ""
  const currentRole = searchParams.get("role") ?? ""

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

  const hasFilters = currentSearch || currentRole

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users by name..."
            defaultValue={currentSearch}
            onChange={(e) => updateParam("search", e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["buyer", "seller", "admin"] as const).map((role) => (
            <button
              key={role}
              onClick={() => updateParam("role", currentRole === role ? "" : role)}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                currentRole === role
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              }`}
            >
              {ROLE_LABELS[role]}
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
        {count} user{count === 1 ? "" : "s"}
        {hasFilters ? " matching filters" : ""}
      </p>

      {/* Table */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card py-16 text-center">
          <UsersIcon className="size-10 text-muted-foreground/60" />
          <h2 className="font-heading text-lg font-semibold">No users found</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or filters."
              : "When users register on the marketplace, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Trust</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const isSuspended = user.suspended_at != null
                return (
                  <tr key={user.id} className="text-sm transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">{initials(user.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {user.full_name ?? "Unnamed user"}
                          </p>
                          <div className="flex items-center gap-1.5">
                            {user.phone_verified ? (
                              <Badge variant="outline" className="h-4 px-1 text-[0.6rem]">Phone</Badge>
                            ) : null}
                            {user.fayda_verified ? (
                              <Badge variant="outline" className="h-4 px-1 text-[0.6rem]">Fayda</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{ROLE_LABELS[user.role] ?? user.role}</Badge>
                      {isSuspended ? (
                        <Badge variant="outline" className="ml-1.5 border-red-200 text-red-700">Suspended</Badge>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.city ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{user.trust_score ?? 0}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
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
