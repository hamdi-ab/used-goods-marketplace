import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      <h1 className="max-w-2xl font-heading text-4xl font-semibold leading-[1.3] tracking-tight text-foreground sm:text-5xl">
        Find your next thing. Sell what you no longer need.
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        VinTech Marketplace connects buyers and sellers for trusted,
        convenient second-hand commerce.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/search">Browse listings</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/sell">Start selling</Link>
        </Button>
      </div>
    </main>
  );
}
