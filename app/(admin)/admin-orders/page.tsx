"use client";

import { useEffect, useMemo, useState } from "react";

type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "failed";

type AdminOrder = {
  _id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: { name: string; qty: number }[];
  user?: { name?: string };
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
  failed: "Başarısız",
};

const statusStyles: Record<OrderStatus, string> = {
  pending: "border-[#f59e0b44] bg-[#f59e0b1a] text-[#fcd34d]",
  paid: "border-[#22c55e44] bg-[#22c55e1a] text-[#86efac]",
  shipped: "border-[#3b82f644] bg-[#3b82f61a] text-[#93c5fd]",
  delivered: "border-[#16a34a44] bg-[#16a34a1a] text-[#86efac]",
  cancelled: "border-[#ef444444] bg-[#ef44441a] text-[#fca5a5]",
  failed: "border-[#dc262644] bg-[#dc26261a] text-[#fca5a5]",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/orders?all=true", { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { orders: AdminOrder[] };
      setOrders(data.orders ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders();
  }, []);

  const filteredOrders = useMemo(
    () => (statusFilter === "all" ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setOrders((prev) => prev.map((order) => (order._id === id ? { ...order, status } : order)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Sipariş Yönetimi</h1>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "all" | OrderStatus)}
          className="rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-2 text-sm text-zinc-200 focus:outline-none"
        >
          <option value="all">Tüm durumlar</option>
          <option value="pending">Beklemede</option>
          <option value="shipped">Kargoda</option>
          <option value="delivered">Teslim Edildi</option>
        </select>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-[#1f1f1f] bg-[#111111]">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="text-zinc-500">
            <tr className="border-b border-[#1f1f1f]">
              <th className="px-4 py-3 font-medium">Sipariş No</th>
              <th className="px-4 py-3 font-medium">Müşteri</th>
              <th className="px-4 py-3 font-medium">Ürünler</th>
              <th className="px-4 py-3 font-medium">Toplam</th>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-zinc-400" colSpan={6}>
                  Loading orders...
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id} className="border-b border-[#191919] transition hover:bg-[#111111]">
                  <td className="px-4 py-3 text-zinc-300">#{order._id.slice(-6).toUpperCase()}</td>
                  <td className="px-4 py-3 text-zinc-300">{order.user?.name ?? "Unknown user"}</td>
                  <td className="px-4 py-3 text-zinc-400">
                    {order.items.slice(0, 2).map((item) => `${item.name} x${item.qty}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 text-white">{order.total.toLocaleString("tr-TR")} TL</td>
                  <td className="px-4 py-3 text-zinc-500">
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs ${statusStyles[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                      <select
                        value={order.status}
                        onChange={(event) =>
                          void handleStatusChange(order._id, event.target.value as OrderStatus)
                        }
                        className="rounded-md border border-[#2a2a2a] bg-[#0d0d0d] px-2 py-1 text-xs text-zinc-200"
                      >
                        <option value="pending">Beklemede</option>
                        <option value="paid">Ödendi</option>
                        <option value="shipped">Kargoda</option>
                        <option value="delivered">Teslim Edildi</option>
                        <option value="cancelled">İptal</option>
                        <option value="failed">Başarısız</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
