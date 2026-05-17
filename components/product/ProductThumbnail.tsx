"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImageFallback, getProductImageUrl } from "@/lib/productImage";

type ProductThumbnailProps = {
  name: string;
  slug?: string;
  image?: string;
  images?: { url?: string | null }[];
  categorySlug?: string;
  className?: string;
  sizes?: string;
};

export function ProductThumbnail({
  name,
  slug,
  image,
  images,
  categorySlug,
  className = "relative h-32 w-full overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0f0f16]",
  sizes = "256px",
}: ProductThumbnailProps) {
  const primarySrc = getProductImageUrl({ name, slug, image, images, categorySlug });
  const fallbackSrc = getProductImageFallback(name);
  const [src, setSrc] = useState(primarySrc);

  return (
    <div className={className}>
      <Image
        src={src}
        alt={name}
        fill
        className="object-cover"
        sizes={sizes}
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc);
        }}
      />
    </div>
  );
}
