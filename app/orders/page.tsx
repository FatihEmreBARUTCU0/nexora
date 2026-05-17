"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

type OrderItem = {
  name: string;
  qty: number;
};

type Order = {
  _id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "failed";
  total: number;
  createdAt: string;
  items: OrderItem[];
};

const statusStyles: Record<Order["status"], string> = {
  pending: "border-[#f59e0b55] bg-[#f59e0b1f] text-[#fde68a]",
  paid: "border-[#22c55e55] bg-[#22c55e1f] text-[#86efac]",
  shipped: "border-[#3b82f644] bg-[#3b82f61a] text-[#93c5fd]",
  delivered: "border-[#16a34a44] bg-[#16a34a1a] text-[#86efac]",
  cancelled: "border-[#ef444455] bg-[#ef44441f] text-[#fca5a5]",
  failed: "border-[#ef444444] bg-[#ef44441a] text-[#fca5a5]",
};

export default function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { clearCart } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const shouldClearCart = params.get("clearCart") === "true";

    if (payment === "success") {
      toast.success("Ödemeniz alındı.");
    } else if (payment === "failed") {
      toast.error("Ödeme başarısız. Lütfen tekrar deneyin.");
    }

    if (shouldClearCart) {
      clearCart();
    }

    if (payment || shouldClearCart) {
      router.replace(pathname);
    }
  }, [clearCart, pathname, router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    if (status === "authenticated") {
      (async () => {
        try {
          const response = await fetch("/api/orders", { cache: "no-store" });
          if (!response.ok) return;
          const data = (await response.json()) as { orders: Order[] };
          setOrders(data.orders ?? []);
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [router, status]);

  if (status === "loading" || loading) {
    return <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 text-zinc-400 md:px-10">Siparişler yükleniyor...</div>;
  }

  if (!session?.user) return null;

  if (orders.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-6 pb-24 pt-12 md:px-10">
        <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] px-8 py-12 text-center">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Henüz siparişiniz yok</h1>
          <p className="mt-3 text-zinc-400">İlk siparişinizi oluşturmak için ürünleri keşfedin.</p>
          <Link
            href="/products"
            className="mt-8 inline-flex rounded-full bg-[#b44dff] px-7 py-3 text-sm font-medium text-white transition hover:bg-[#9f33ee]"
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
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">Siparişlerim</h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <article key={order._id} className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-zinc-500">Sipariş #{order._id.slice(-6).toUpperCase()}</p>
                <p className="mt-1 text-sm text-zinc-400">
                  {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs ${statusStyles[order.status]}`}>
                {({ pending: "Beklemede", paid: "Ödendi", shipped: "Kargoda", delivered: "Teslim Edildi", cancelled: "İptal", failed: "Başarısız" } as Record<string, string>)[order.status] ?? order.status}
              </span>
            </div>
            <p className="mt-4 text-lg font-medium text-white">{order.total.toLocaleString("tr-TR")} TL</p>
            <p className="mt-2 text-sm text-zinc-400">
              {order.items.slice(0, 3).map((item) => `${item.name} x${item.qty}`).join(", ")}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
