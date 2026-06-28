"use client";

import { useState } from "react";
import Image from "next/image";

type GalleryProps = {
  images: string[];
  /** Accessible label / alt text base (product name). */
  alt: string;
};

/**
 * Product gallery for the PDP: a large main image plus a clickable thumbnail
 * strip. Selecting a thumbnail swaps the main image. Client component because
 * it holds the active-image selection state.
 */
export function Gallery({ images, alt }: GalleryProps) {
  const safeImages = images.length > 0 ? images : [""];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = Math.min(activeIndex, safeImages.length - 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-blush">
        {safeImages[active] && (
          <Image
            src={safeImages[active]}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-center"
          />
        )}
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.map((src, index) => {
            const isActive = index === active;
            return (
              <button
                key={src + index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver imagen ${index + 1} de ${alt}`}
                aria-pressed={isActive}
                className={`relative aspect-[3/4] overflow-hidden bg-blush transition-all duration-300 ease-luxe ${
                  isActive
                    ? "ring-1 ring-champagne-deep ring-offset-2 ring-offset-ivory"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 25vw, 12vw"
                  className="object-cover object-center"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Gallery;
