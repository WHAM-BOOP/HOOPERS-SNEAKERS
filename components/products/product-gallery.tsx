"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

type GalleryImage = { id: string; url: string; alt: string | null };

/**
 * Product image gallery: main image + thumbnail switcher. Buttons are real
 * buttons with accessible names; works with keyboard only.
 */
export function ProductGallery({
  productName,
  fallbackUrl,
  images,
}: {
  productName: string;
  fallbackUrl: string | null;
  images: GalleryImage[];
}) {
  const allImages: GalleryImage[] =
    images.length > 0
      ? images
      : fallbackUrl
        ? [{ id: "main", url: fallbackUrl, alt: productName }]
        : [];

  const [activeIndex, setActiveIndex] = useState(0);
  const active = allImages[activeIndex];

  if (!active) {
    return (
      <div
        className="flex aspect-[4/5] w-full items-center justify-center rounded-md border border-line bg-surface"
        role="img"
        aria-label={`${productName} — image coming soon`}
      >
        <span
          aria-hidden="true"
          className="text-6xl font-black text-ink/10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          HS
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md border border-line bg-surface">
        <Image
          key={active.id}
          src={active.url}
          alt={active.alt ?? productName}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {allImages.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${allImages.length}`}
              aria-current={index === activeIndex ? "true" : undefined}
              className={cn(
                "relative aspect-square overflow-hidden rounded-sm border-2 transition-colors",
                index === activeIndex
                  ? "border-accent"
                  : "border-transparent hover:border-line-strong",
              )}
            >
              <Image
                src={image.url}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
