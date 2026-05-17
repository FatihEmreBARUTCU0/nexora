"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { AddToCartButton } from "@/components/product/AddToCartButton";

type UpsellProduct = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  brand?: string;
  images?: { url: string }[];
};

export function UpsellWidget() {
  const { items } = useCart();
  const [suggestions, setSuggestions] = useState<UpsellProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (items.length === 0 || fetched) return;

    (async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/upsell", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: items.map((item) => ({
              productId: item.productId,
              name: item.name,
              price: item.price,
            })),
          }),
        });

        if (!response.ok) return;
        const data = (await response.json()) as { suggestions?: UpsellProduct[] };
        setSuggestions(data.suggestions ?? []);
      } catch {
        // sessiz hata
      } finally {
        setLoading(false);
        setFetched(true);
      }
    })();
  }, [items, fetched]);

  if (loading) {
    return (
      <div className="mt-12 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
        <div className="flex items-center gap-2 text-zinc-400">
          <Sparkles size={16} className="animate-pulse text-[#6366f1]" />
          <span className="text-sm">AI öneriler hazırlanıyor...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <section className="mt-12 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
      <div className="mb-6 flex items-center gap-3">
        <Sparkles size={16} className="text-[#6366f1]" />
        <h2 className="text-lg font-medium text-white">Bunları da beğenebilirsin</h2>
        <span className="rounded-full border border-[#6366f133] bg-[#6366f111] px-2 py-0.5 text-[10px] text-[#a5b4fc]">
          AI Öneri
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {suggestions.map((product) => (
          <article
            key={product._id}
            className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4 transition hover:border-[#6366f133]"
          >
            <Link href={`/products/${product.slug}`} className="block">
              <div className="relative mb-3 h-36 overflow-hidden rounded-lg border border-[#1f1f1f] bg-gradient-to-b from-[#1a1a2b] to-[#0f0f16]">
                {product.images?.[0]?.url ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : null}
              </div>
              {product.brand ? (
                <p className="text-xs text-zinc-500">{product.brand}</p>
              ) : null}
              <h3 className="mt-1 text-sm font-medium text-white line-clamp-2">{product.name}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-base font-semibold text-white">
                  {product.price.toLocaleString("tr-TR")} TL
                </span>
                {product.comparePrice ? (
                  <span className="text-xs text-zinc-500 line-through">
                    {product.comparePrice.toLocaleString("tr-TR")} TL
                  </span>
                ) : null}
              </div>
            </Link>
            <div className="mt-3">
              <AddToCartButton
                product={{
                  productId: product._id,
                  name: product.name,
                  price: product.price,
                  image: product.images?.[0]?.url ?? "",
                  slug: product.slug,
                }}
                compact
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
