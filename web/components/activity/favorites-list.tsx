import Link from "next/link"
import { Button } from "@/components/ui/button"

export async function FavoritesList({ userId }: { userId: string }) {
  return (
    <div className="text-center py-12">
      <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-2xl">❤️</div>
      <h3 className="font-semibold mb-1">Favorites</h3>
      <p className="text-sm text-muted-foreground mb-4">Save listings you love and find them here later.</p>
      <Button asChild><Link href="/search">Browse listings</Link></Button>
    </div>
  )
}
