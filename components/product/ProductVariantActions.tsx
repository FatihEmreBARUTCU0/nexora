"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import { FavoriteButton } from "@/components/product/FavoriteButton";

export type VariantGroup = {
  label: string;
  values: string[];
};

type ProductVariantActionsProps = {
  product: {
    productId: string;
    name: string;
    price: number;
    image: string;
    slug: string;
  };
  variantGroups: VariantGroup[];
};

export function ProductVariantActions({ product, variantGroups }: ProductVariantActionsProps) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(
    Object.fromEntries(variantGroups.map((group) => [group.label, group.values[0] ?? ""]))
  );

  const selectedColor = selectedVariants["Renk"] ?? selectedVariants["renk"] ?? "";
  const selectedSize = selectedVariants["Beden"] ?? selectedVariants["beden"] ?? "";

  return (
    <>
      {variantGroups.map((group) => (
        <div key={group.label} className="mt-6">
          <p className="mb-3 text-sm text-zinc-300">{group.label}</p>
          <div className="flex flex-wrap gap-3">
            {group.values.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSelectedVariants((prev) => ({ ...prev, [group.label]: value }))
                }
                className={`rounded-full border px-4 py-2 text-sm text-zinc-200 transition ${
                  selectedVariants[group.label] === value
                    ? "border-[#6366f1] bg-[#6366f11a]"
                    : "border-[#2a2a2a] hover:border-[#6366f1]"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-10 flex flex-wrap gap-3">
        <AddToCartButton
          product={{
            ...product,
            selectedColor,
            selectedSize,
          }}
        />
        <FavoriteButton
          productId={product.productId}
          productName={product.name}
          productSlug={product.slug}
          productPrice={product.price}
          productImage={product.image}
          inline
        />
      </div>
    </>
  );
}
