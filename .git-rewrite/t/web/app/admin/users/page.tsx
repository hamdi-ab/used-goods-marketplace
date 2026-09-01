import type { Metadata } from "next"
import Link from "next/link"
import { UsersIcon } from "lucide-react"

import { fetchAdminUsers } from "@/lib/admin"
import { nextOffset, parseOffset } from "@/lib/pagination"
import { AdminUserRow } from "@/components/admin/admin-user-row"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Admin — Users",
  description: "Manage marketplace users.",
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const offset = parseOffset((await searchParams).offset)
  const { users, count, hasMore, error } = await fetchAdminUsers({ offset })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          {(count ?? 0).toLocaleString()} registered{" "}
          {(count ?? 0) === 1 ? "user" : "users"}. Use Suspend to demote a
          seller and archive their live listings; Restore re-instates a
          suspended seller.
        </p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <UsersIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">
              Could not load users
            </h2>
          </CardContent>
        </Card>
      ) : users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <UsersIcon className="size-8 text-muted-foreground" />
            <h2 className="font-heading text-lg font-semibold">No users yet</h2>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {users.map((user) => (
              <AdminUserRow key={user.id} user={user} />
            ))}
          </ul>
          {hasMore ? (
            <div className="mt-8 flex justify-center">
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
