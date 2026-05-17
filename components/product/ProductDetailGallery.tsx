"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ProductImage = {
  url?: string;
  publicId?: string;
};

type ProductDetailGalleryProps = {
  name: string;
  images?: ProductImage[];
};

function buildPlaceholder(name: string): string {
  return `https://placehold.co/1200x1200/111111/ffffff?text=${encodeURIComponent(name.slice(0, 40))}`;
}

function normalizeImages(images: ProductImage[] | undefined, fallbackName: string): string[] {
  const urls = (images ?? [])
    .map((image) => image?.url?.trim())
    .filter((url): url is string => Boolean(url));

  if (urls.length > 0) return urls;
  return [buildPlaceholder(fallbackName)];
}

export function ProductDetailGallery({ name, images }: ProductDetailGalleryProps) {
  const galleryImages = useMemo(() => normalizeImages(images, name), [images, name]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const activeSrc = failedUrls.has(galleryImages[activeIndex])
    ? buildPlaceholder(name)
    : galleryImages[activeIndex];

  const handleError = (url: string) => {
    setFailedUrls((prev) => new Set(prev).add(url));
  };

  return (
    <section>
      <div className="relative h-[420px] w-full overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0f0f16] sm:h-[480px] lg:h-[540px]">
        <Image
          src={activeSrc}
          alt={name}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          onError={() => handleError(galleryImages[activeIndex])}
        />
      </div>

      {galleryImages.length > 1 ? (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {galleryImages.map((url, index) => {
            const thumbSrc = failedUrls.has(url) ? buildPlaceholder(name) : url;
            const isActive = index === activeIndex;

            return (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition ${
                  isActive
                    ? "border-[#b44dff] ring-2 ring-[#b44dff]/40"
                    : "border-[#1f1f1f] hover:border-[#b44dff]"
                }`}
                aria-label={`${name} görsel ${index + 1}`}
              >
                <Image
                  src={thumbSrc}
                  alt={`${name} görsel ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  onError={() => handleError(url)}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
