"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ExpandIcon } from "lucide-react"

type GalleryImage = { id?: string | null; image_url: string; alt_text?: string | null }

export function ListingGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const goPrev = useCallback(() => {
    setActive((i) => (i === 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const goNext = useCallback(() => {
    setActive((i) => (i === images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightbox) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      if (e.key === "ArrowRight") goNext()
      if (e.key === "Escape") setLightbox(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [lightbox, goPrev, goNext])

  if (images.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border bg-muted text-muted-foreground">
        No photo available
      </div>
    )
  }

  const current = images[active]

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="group relative min-h-[300px] flex-1 overflow-hidden rounded-xl border bg-muted">
          <Image
            src={current.image_url}
            alt={current.alt_text ?? title}
            fill
            priority={active === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="cursor-zoom-in object-cover transition-transform duration-300 group-hover:scale-105"
            onClick={() => setLightbox(true)}
          />

          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
            {active + 1} / {images.length}
          </div>

          <button
            type="button"
            onClick={() => setLightbox(true)}
            className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Expand image"
          >
            <ExpandIcon className="size-4" />
          </button>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="mt-4 -mx-1">
            <div className="flex gap-2 overflow-x-auto pb-1 px-1 scrollbar-thin">
              {images.map((img, i) => (
                <button
                  key={img.id ?? i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1} of ${images.length}`}
                  aria-current={i === active ? "true" : undefined}
                  className={`relative aspect-[4/3] w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 bg-muted ring-offset-2 transition-all ${
                    i === active
                      ? "border-[#2563EB] opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={img.image_url}
                    alt={img.alt_text ?? title}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <XIcon className="size-6" />
          </button>

          <div
            className="relative h-[85vh] w-[90vw] max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={current.image_url}
              alt={current.alt_text ?? title}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="Previous image"
              >
                <ChevronLeftIcon className="size-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                aria-label="Next image"
              >
                <ChevronRightIcon className="size-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActive(i) }}
                    aria-label={`Go to image ${i + 1}`}
                    className={`size-2 rounded-full transition ${
                      i === active ? "bg-white" : "bg-white/40 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
