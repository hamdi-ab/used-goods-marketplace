import type { Metadata } from "next"
import Link from "next/link"
import { HeartIcon, LayoutDashboardIcon, PlusIcon, UserRoundIcon } from "lucide-react"

import { requireUser, ROLE_LABELS } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your VinTech Marketplace dashboard.",
}

export default async function DashboardPage() {
  const user = await requireUser()

  const firstName = user.fullName?.split(" ")[0] ?? "there"

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Badge variant="secondary">{ROLE_LABELS[user.role] ?? "Buyer"}</Badge>
        <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Manage your marketplace activity from here. List management tools arrive as
          the platform grows.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusIcon className="size-5 text-primary" />
              Sell an item
            </CardTitle>
            <CardDescription>
              Create a listing and reach buyers across the marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/sell">Create a listing</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HeartIcon className="size-5 text-primary" />
              Favorites
            </CardTitle>
            <CardDescription>
              Review the listings you have saved for later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/favorites">View favorites</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRoundIcon className="size-5 text-primary" />
              Your profile
            </CardTitle>
            <CardDescription>
              Check how buyers and sellers see you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/profile">View profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutDashboardIcon className="size-5 text-primary" />
              Role
            </CardTitle>
            <CardDescription>
              Your account role is <span className="font-medium text-foreground">{ROLE_LABELS[user.role] ?? user.role}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              New accounts start as buyers. Selling tools unlock when listings go live.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}