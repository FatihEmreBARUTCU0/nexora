"use client";

import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { CartItemImage } from "@/components/cart/CartItemImage";
import { useCart } from "@/context/CartContext";
import { UpsellWidget } from "@/components/ai/UpsellWidget";

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();
  const isEmpty = items.length === 0;
  const subtotal = totalPrice;
  const FREE_SHIPPING_THRESHOLD = 500;
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49.9;
  const total = subtotal + shipping;

  if (isEmpty) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-7xl items-center justify-center px-6 py-16 md:px-10">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-[#1f1f1f] bg-[#111111] px-8 py-14 text-center">
          <ShoppingBag size={34} className="text-zinc-400" />
          <h1 className="mt-5 text-3xl font-semibold tracking-[-0.03em] text-white">Sepetiniz boş</h1>
          <p className="mt-3 text-zinc-400">Beğendiğiniz ürünleri sepete ekleyerek alışverişe başlayın.</p>
          <Link
            href="/products"
            className="mt-8 rounded-full bg-[#6366f1] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8]"
          >
            Alışverişe Başla
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 flex items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">Sepetim</h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <article
              key={`${item.productId}-${item.selectedColor ?? ""}-${item.selectedSize ?? ""}`}
              className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-4 md:p-5"
            >
              <div className="flex gap-4">
                <div className="shrink-0">
                  <CartItemImage item={item} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-sm font-medium leading-snug text-white md:text-lg">{item.name}</h2>
                    <button
                      type="button"
                      aria-label="Ürünü sil"
                      className="shrink-0 rounded-full border border-[#2a2a2a] p-1.5 text-zinc-400 transition hover:border-[#3a3a3a] hover:text-white"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-zinc-300 md:mt-2">{item.price.toLocaleString("tr-TR")} TL</p>
                  <div className="mt-3 inline-flex items-center rounded-full border border-[#2a2a2a] bg-[#0d0d0d]">
                    <button
                      type="button"
                      className="px-3 py-2 text-zinc-300 hover:text-white"
                      aria-label="Azalt"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    >
                      <Minus size={13} />
                    </button>
                    <span className="px-2 text-sm text-white">{item.quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-zinc-300 hover:text-white"
                      aria-label="Arttır"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
          <h2 className="text-xl font-medium text-white">Sipariş Özeti</h2>
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Ara Toplam</span>
              <span>{subtotal.toLocaleString("tr-TR")} TL</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Kargo</span>
              {shipping === 0 ? (
                <span className="rounded-full border border-[#22c55e33] bg-[#22c55e1a] px-2 py-0.5 text-xs text-[#86efac]">
                  Ücretsiz
                </span>
              ) : (
                <span>{shipping.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
              )}
            </div>
            {shipping > 0 && (
              <p className="text-xs text-zinc-500">
                {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString("tr-TR", { maximumFractionDigits: 0 })} TL daha ekle, kargo ücretsiz olsun
              </p>
            )}
            <div className="h-px bg-[#1f1f1f]" />
            <div className="flex items-center justify-between text-base font-medium text-white">
              <span>Toplam</span>
              <span>{total.toLocaleString("tr-TR")} TL</span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#6366f1] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8]"
          >
            Ödemeye Geç
          </Link>
        </aside>
      </div>

      <UpsellWidget />
    </div>
  );
}
