"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart, type CartItem } from "@/context/CartContext";

const SYNC_DEBOUNCE_MS = 1500;
const CART_OWNER_KEY = "nexora-cart-owner";

export function CartSyncManager() {
  const { data: session, status } = useSession();
  const { items, mergeWithDB, clearCart } = useCart();
  const syncedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Çıkış algılama: localStorage'daki sahip ID'si ile karşılaştır
  // authenticated → loading → unauthenticated geçişini ve sayfa yenilemesini yakalar
  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.id) {
      const storedOwner = localStorage.getItem(CART_OWNER_KEY);

      if (storedOwner && storedOwner !== session.user.id) {
        // Farklı kullanıcı girmiş — önceki sepeti temizle
        clearCart();
        syncedRef.current = false;
      }

      localStorage.setItem(CART_OWNER_KEY, session.user.id);

      if (!syncedRef.current) {
        (async () => {
          try {
            const response = await fetch("/api/user/cart");
            if (!response.ok) return;
            const data = (await response.json()) as { cart: CartItem[] };
            if (data.cart?.length > 0) {
              mergeWithDB(data.cart);
            }
          } catch {
            // sessiz hata
          } finally {
            syncedRef.current = true;
          }
        })();
      }

      return;
    }

    if (status === "unauthenticated") {
      const storedOwner = localStorage.getItem(CART_OWNER_KEY);

      // localStorage'da kullanıcı kaydı varsa çıkış yapılmış demektir
      if (storedOwner) {
        clearCart();
        localStorage.removeItem(CART_OWNER_KEY);
      }

      syncedRef.current = false;
    }
  }, [status, session?.user?.id, mergeWithDB, clearCart]);

  // Sepet değişince debounce ile DB'ye kaydet
  useEffect(() => {
    if (status !== "authenticated" || !syncedRef.current) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      fetch("/api/user/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, SYNC_DEBOUNCE_MS);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [items, status]);

  return null;
}
