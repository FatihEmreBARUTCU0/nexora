"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCart, type CartItem } from "@/context/CartContext";

const SYNC_DEBOUNCE_MS = 1500;

export function CartSyncManager() {
  const { data: session, status } = useSession();
  const { items, mergeWithDB, clearCart } = useCart();
  const syncedRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevStatusRef = useRef(status);

  // Giriş yapıldığında DB'den sepeti çek ve merge et
  useEffect(() => {
    const previousStatus = prevStatusRef.current;
    const wasUnauthenticated = previousStatus !== "authenticated";
    prevStatusRef.current = status;

    if (status === "unauthenticated" && previousStatus === "authenticated") {
      clearCart();
      syncedRef.current = false;
      return;
    }

    if (status !== "authenticated" || !session?.user?.id) return;
    if (syncedRef.current && !wasUnauthenticated) return;

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
