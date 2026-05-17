"use client";

import Image from "next/image";
import { useState } from "react";
import type { CartItem } from "@/context/CartContext";
import { getCartItemImageUrl } from "@/lib/cartImage";

type CartItemImageProps = {
  item: CartItem;
};

export function CartItemImage({ item }: CartItemImageProps) {
  const primarySrc = getCartItemImageUrl(item);
  const fallbackSrc = `https://placehold.co/400x400/1a1a2e/e2e8f0?text=${encodeURIComponent(item.name.slice(0, 24))}`;
  const [src, setSrc] = useState(primarySrc);

  return (
    <div className="relative h-[110px] w-full overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0f0f16] md:h-full md:min-h-[110px]">
      <Image
        src={src}
        alt={item.name}
        fill
        className="object-cover"
        sizes="120px"
        onError={() => {
          if (src !== fallbackSrc) setSrc(fallbackSrc);
        }}
      />
    </div>
  );
}
