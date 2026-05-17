"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

type FeaturedProduct = {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  brand?: string;
  sold?: number;
  ratings?: { avg?: number };
  images?: { url: string }[];
  slug: string;
};

const badgeStyles: Record<string, string> = {
  Yeni: "border-[#6366f144] bg-[#6366f11f] text-[#a5b4fc]",
  İndirim: "border-[#22c55e44] bg-[#22c55e1a] text-[#86efac]",
  "Çok Satan": "border-[#f59e0b44] bg-[#f59e0b1a] text-[#fcd34d]",
};

const featuredGradients = [
  "from-[#23243d] via-[#171727] to-[#0f0f16]",
  "from-[#1d2537] via-[#141a26] to-[#0d1018]",
  "from-[#1a2b24] via-[#13201b] to-[#0d1612]",
  "from-[#2a2042] via-[#1b1730] to-[#110f1d]",
];

function getBadgeFromSold(sold: number): keyof typeof badgeStyles {
  if (sold >= 60) return "Çok Satan";
  if (sold >= 30) return "İndirim";
  return "Yeni";
}

export function FeaturedProductsGrid({ products }: { products: FeaturedProduct[] }) {
  const { addToCart } = useCart();

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {products.map((product, index) => {
        const badge = getBadgeFromSold(product.sold ?? 0);

        return (
          <Link
            key={product._id}
            href={`/products/${product.slug}`}
            className="group rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#6366f1] hover:shadow-[0_0_28px_rgba(99,102,241,0.22)]"
          >
            <div
              className={`relative mb-6 min-h-[280px] overflow-hidden rounded-xl border border-[#1f1f1f] bg-gradient-to-b ${
                featuredGradients[index % featuredGradients.length]
              } p-4`}
            >
              {product.images?.[0]?.url ? (
                <Image
                  src={product.images[0].url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1280px) 50vw, 25vw"
                />
              ) : null}
              <p
                className={`relative z-10 inline-flex rounded-full border px-3 py-1 text-xs ${badgeStyles[badge]}`}
              >
                {badge}
              </p>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  addToCart(
                    {
                      productId: product._id,
                      name: product.name,
                      price: product.price,
                      image: product.images?.[0]?.url ?? "",
                      slug: product.slug,
                    },
                    1
                  );
                  toast.success("Ürün sepete eklendi!");
                }}
                className="absolute bottom-4 left-4 right-4 z-10 rounded-full border border-[#2a2a2a] bg-[#0a0a0a]/90 px-4 py-3 text-sm font-medium text-white transition sm:opacity-0 sm:group-hover:opacity-100"
              >
                Sepete Ekle
              </button>
            </div>
            <p className="mb-3 text-xs uppercase tracking-[0.14em] text-zinc-500">
              {product.brand ?? "Nexora"}
            </p>
            <h3 className="text-lg font-medium text-white">{product.name}</h3>
            <div className="mt-3 flex items-center gap-1 text-sm text-zinc-300">
              <Star size={14} className="fill-zinc-300 text-zinc-300" />
              <span>{(product.ratings?.avg ?? 0).toFixed(1)}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <p className="text-base font-medium text-white">{product.price.toLocaleString("tr-TR")} TL</p>
              {product.comparePrice ? (
                <p className="text-sm text-zinc-500 line-through">
                  {product.comparePrice.toLocaleString("tr-TR")} TL
                </p>
              ) : null}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
