export default function FavoritesLoading() {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:py-12">
      <div className="mb-8 h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 animate-pulse sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] w-full rounded-lg bg-muted" />
            <div className="mt-2 h-4 w-3/4 rounded bg-muted" />
            <div className="mt-2 h-4 w-1/4 rounded bg-muted" />
          </div>
        ))}
      </div>
    </main>
  )
}
