import type { Metadata } from "next"
import Link from "next/link"

import { fetchAdminUsers } from "@/lib/admin"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { UsersTable } from "@/components/admin/users-table"

export const metadata: Metadata = {
  title: "Admin — Users",
  description: "Manage marketplace users.",
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const offset = parseOffset(sp.offset)
  const search = typeof sp.search === "string" ? sp.search : ""
  const role = sp.role === "buyer" || sp.role === "seller" || sp.role === "admin" ? sp.role : undefined

  const { users, count, hasMore, error } = await fetchAdminUsers(
    { offset },
    { search, role }
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage marketplace users. Use Suspend to demote a seller and archive their live listings.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <>
          <UsersTable users={users} count={count ?? 0} />
          {hasMore ? (
            <div className="mt-6 flex justify-center">
              <Link
                href={`/admin/users?offset=${nextOffset(offset)}`}
                className="text-sm font-medium underline"
              >
                Load more
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
