"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/context/CartContext";
import { CartSyncManager } from "@/components/providers/CartSyncManager";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>
        <CartSyncManager />
        {children}
      </CartProvider>
    </SessionProvider>
  );
}
