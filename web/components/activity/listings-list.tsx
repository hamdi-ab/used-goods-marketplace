import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function ListingsList({ userId }: { userId: string }) {
  return (
    <div className="text-center py-12">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">📦</div>
      <h3 className="font-semibold mb-1">My listings</h3>
      <p className="text-sm text-muted-foreground mb-4">Manage the items you're selling.</p>
      <Button asChild><Link href="/sell">Create a listing</Link></Button>
    </div>
  )
}
