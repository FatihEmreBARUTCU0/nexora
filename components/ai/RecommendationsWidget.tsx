"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ProductThumbnail } from "@/components/product/ProductThumbnail";

type RecommendedProduct = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  brand?: string;
  images?: { url?: string | null }[];
};

export function RecommendationsWidget() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<RecommendedProduct[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/ai/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (!response.ok) return;
        const data = (await response.json()) as { recommendations?: RecommendedProduct[] };
        setProducts(data.recommendations ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-[120px] md:px-10">
      <div className="mb-10 flex items-center gap-6">
        <h2 className="text-2xl font-medium text-white md:text-3xl">Senin için öneriler</h2>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <Link
            key={product._id}
            href={`/products/${product.slug}`}
            className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5 transition hover:-translate-y-1 hover:border-[#6366f1]"
          >
            <ProductThumbnail
              name={product.name}
              slug={product.slug}
              images={product.images}
              className="relative mb-4 h-32 w-full overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0f0f16]"
            />
            <p className="text-sm text-zinc-400">{product.brand ?? "Nexora"}</p>
            <h3 className="mt-2 text-base font-medium text-white">{product.name}</h3>
            <p className="mt-3 text-lg font-semibold text-white">{product.price.toLocaleString("tr-TR")} TL</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
