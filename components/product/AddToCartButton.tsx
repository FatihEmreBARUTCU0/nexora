"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

type AddToCartButtonProps = {
  product: {
    productId: string;
    name: string;
    price: number;
    image: string;
    slug: string;
    selectedColor?: string;
    selectedSize?: string;
  };
  compact?: boolean;
};

export function AddToCartButton({ product, compact = false }: AddToCartButtonProps) {
  const { addToCart, items } = useCart();
  const isInCart = items.some(
    (item) =>
      item.productId === product.productId &&
      item.selectedColor === product.selectedColor &&
      item.selectedSize === product.selectedSize
  );

  if (compact) {
    return isInCart ? (
      <Link
        href="/cart"
        className="inline-flex w-full items-center justify-center rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-[#6366f1] hover:text-white"
      >
        Sepette
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => {
          addToCart(product, 1);
          toast.success("Ürün sepete eklendi!");
        }}
        className="w-full rounded-lg bg-[#6366f1] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#5458e8]"
      >
        Sepete Ekle
      </button>
    );
  }

  return isInCart ? (
    <Link
      href="/cart"
      className="inline-flex rounded-full border border-[#2a2a2a] px-8 py-4 text-sm font-medium text-zinc-200 transition hover:border-[#6366f1] hover:text-white"
    >
      Sepette
    </Link>
  ) : (
    <button
      type="button"
      onClick={() => {
        addToCart(product, 1);
        toast.success("Ürün sepete eklendi!");
      }}
      className="rounded-full bg-[#6366f1] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8]"
    >
      Sepete Ekle
    </button>
  );
}
