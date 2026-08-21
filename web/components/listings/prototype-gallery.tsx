"use client"

import { useState } from "react"
import Image from "next/image"

type GalleryImage = { id?: string | null; image_url: string; alt_text?: string | null }

export function PrototypeGallery({
  images,
  title,
}: {
  images: GalleryImage[]
  title: string
}) {
  const [active, setActive] = useState(0)
  const current = images[active]
  const thumbs = images.slice(0, 5)
  const extra = images.length - thumbs.length

  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-[300px] flex-1 overflow-hidden rounded-xl border bg-muted">
        {current ? (
          <Image
            src={current.image_url}
            alt={current.alt_text ?? title}
            fill
            priority={active === 0}
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            No photo available
          </div>
        )}
      </div>

      {images.length > 1 ? (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {thumbs.map((img, i) => (
            <button
              key={img.id ?? i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1} of ${images.length}`}
              aria-current={i === active ? "true" : undefined}
              className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border bg-muted ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-[#2563EB]"
            >
              <Image
                src={img.image_url}
                alt={img.alt_text ?? title}
                fill
                sizes="120px"
                className="object-cover transition-opacity"
              />
              {i === active ? (
                <span className="absolute inset-0 rounded-lg ring-2 ring-inset ring-[#2563EB]" />
              ) : null}
              {extra > 0 && i === thumbs.length - 1 ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                  +{extra}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}