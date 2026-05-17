"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

const CONFETTI_COLORS = ["#6366f1", "#22c55e", "#f43f5e", "#eab308", "#38bdf8", "#a78bfa"];

export function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const orderId = searchParams.get("orderId");
  const shouldClearCart = searchParams.get("clearCart") === "true";

  const displayOrderId = useMemo(() => {
    if (!orderId) return null;
    return orderId.length > 8 ? orderId.slice(-8).toUpperCase() : orderId.toUpperCase();
  }, [orderId]);

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, index) => ({
        id: index,
        left: `${(index * 13) % 100}%`,
        delay: `${(index % 7) * 0.12}s`,
        duration: `${2.4 + (index % 5) * 0.2}s`,
        color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
        rotate: `${(index * 47) % 360}deg`,
      })),
    []
  );

  useEffect(() => {
    if (shouldClearCart) {
      clearCart();
    }
  }, [clearCart, shouldClearCart]);

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-2xl items-center justify-center px-6 py-16 md:px-10">
      <div className="checkout-confetti pointer-events-none" aria-hidden>
        {confettiPieces.map((piece) => (
          <span
            key={piece.id}
            className="checkout-confetti-piece"
            style={{
              left: piece.left,
              animationDelay: piece.delay,
              animationDuration: piece.duration,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotate})`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full rounded-2xl border border-[#1f1f1f] bg-[#111111] px-8 py-12 text-center shadow-[0_0_48px_rgba(99,102,241,0.12)]">
        <div className="checkout-success-check mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-[#22c55e44] bg-[#22c55e14]">
          <Check className="h-12 w-12 text-[#86efac]" strokeWidth={2.5} />
        </div>

        <h1 className="mt-8 text-3xl font-semibold tracking-[-0.03em] text-white">
          Siparişiniz alındı
        </h1>
        <p className="mt-3 text-zinc-400">
          {process.env.NEXT_PUBLIC_NEXORA_DEMO_MODE === "true"
            ? "Demo siparişiniz oluşturuldu. Siparişlerim sayfasından durumu takip edebilirsiniz."
            : "Ödemeniz başarıyla tamamlandı. Siparişiniz hazırlanmaya başlandı."}
        </p>

        {displayOrderId ? (
          <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-5 py-3">
            <span className="text-xs uppercase tracking-[0.14em] text-zinc-500">Sipariş No</span>
            <span className="font-mono text-lg font-medium text-[#c7d2fe]">#{displayOrderId}</span>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center rounded-full bg-[#6366f1] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8]"
          >
            Siparişlerimi Gör
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full border border-[#2a2a2a] px-8 py-4 text-sm font-medium text-zinc-200 transition hover:border-[#6366f1] hover:text-white"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </div>
    </div>
  );
}
