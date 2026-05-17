import {
  AlertTriangle,
  Box,
  CreditCard,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type StatsData = {
  totalRevenue: number;
  monthRevenue: number;
  todayOrders: number;
  totalProducts: number;
  pendingOrders: number;
  recentOrders: {
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
    items: string;
  }[];
  lowStock: { name: string; stock: number }[];
};

const statusStyles: Record<string, string> = {
  pending: "border-[#f59e0b44] bg-[#f59e0b1a] text-[#fcd34d]",
  paid: "border-[#22c55e44] bg-[#22c55e1a] text-[#86efac]",
  shipped: "border-[#3b82f644] bg-[#3b82f61a] text-[#93c5fd]",
  delivered: "border-[#16a34a44] bg-[#16a34a1a] text-[#86efac]",
  cancelled: "border-[#ef444444] bg-[#ef44441a] text-[#fca5a5]",
  failed: "border-[#dc262644] bg-[#dc26261a] text-[#fca5a5]",
};

const statusLabels: Record<string, string> = {
  pending: "Beklemede",
  paid: "Ödendi",
  shipped: "Kargoda",
  delivered: "Teslim Edildi",
  cancelled: "İptal",
  failed: "Başarısız",
};

async function getStats(): Promise<StatsData | null> {
  try {
    const session = await auth();
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";

    if (!host || !session?.user) return null;

    const response = await fetch(`${protocol}://${host}/api/admin/stats`, {
      cache: "no-store",
      headers: {
        Cookie: headerStore.get("cookie") ?? "",
      },
    });

    if (!response.ok) return null;
    return (await response.json()) as StatsData;
  } catch {
    return null;
  }
}

export default async function AdminDashboardPage() {
  const data = await getStats();

  const stats = [
    {
      title: "Toplam Gelir",
      value: data ? `₺${data.totalRevenue.toLocaleString("tr-TR")}` : "—",
      sub: data ? `Bu ay: ₺${data.monthRevenue.toLocaleString("tr-TR")}` : "",
      positive: true,
      icon: CreditCard,
    },
    {
      title: "Bugünkü Sipariş",
      value: data ? String(data.todayOrders) : "—",
      sub: "",
      positive: true,
      icon: ShoppingCart,
    },
    {
      title: "Toplam Ürün",
      value: data ? String(data.totalProducts) : "—",
      sub: "Aktif ürünler",
      positive: true,
      icon: Box,
    },
    {
      title: "Bekleyen Sipariş",
      value: data ? String(data.pendingOrders) : "—",
      sub: "",
      positive: (data?.pendingOrders ?? 0) === 0,
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.title} className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5">
            <div className="mb-4 inline-flex rounded-lg border border-[#262626] bg-[#0d0d0d] p-2 text-zinc-300">
              <stat.icon size={18} />
            </div>
            <p className="text-sm text-zinc-400">{stat.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-white">{stat.value}</p>
            {stat.sub ? (
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-500">
                {stat.sub}
              </p>
            ) : (
              <p
                className={`mt-3 inline-flex items-center gap-1 text-xs ${
                  stat.positive ? "text-[#86efac]" : "text-[#fca5a5]"
                }`}
              >
                {stat.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {stat.positive ? "Normal seviye" : "Aksiyon gerekiyor"}
              </p>
            )}
          </article>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5">
          <h2 className="mb-4 text-lg font-medium text-white">Son Siparişler</h2>
          {!data || data.recentOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Henüz sipariş yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="text-zinc-500">
                  <tr className="border-b border-[#1f1f1f]">
                    <th className="px-2 py-3 font-medium">Sipariş No</th>
                    <th className="px-2 py-3 font-medium">Müşteri</th>
                    <th className="px-2 py-3 font-medium">Ürünler</th>
                    <th className="px-2 py-3 font-medium">Tutar</th>
                    <th className="px-2 py-3 font-medium">Durum</th>
                    <th className="px-2 py-3 font-medium">Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-[#181818]">
                      <td className="px-2 py-3 text-zinc-300">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-2 py-3 text-zinc-300">{order.customer}</td>
                      <td className="px-2 py-3 max-w-[200px] truncate text-zinc-400">{order.items}</td>
                      <td className="px-2 py-3 text-white">₺{order.amount.toLocaleString("tr-TR")}</td>
                      <td className="px-2 py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${
                            statusStyles[order.status] ?? "border-[#2a2a2a] text-zinc-400"
                          }`}
                        >
                          {statusLabels[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-zinc-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5">
          <h2 className="mb-4 text-lg font-medium text-white">Az Kalan Stok</h2>
          {!data || data.lowStock.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-500">Stok sorunu yok.</p>
          ) : (
            <div className="space-y-3">
              {data.lowStock.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-[#1d1d1d] bg-[#0d0d0d] px-3 py-3"
                >
                  <p className="text-sm text-zinc-300">{item.name}</p>
                  <p
                    className={`text-sm font-medium ${
                      item.stock === 0 ? "text-[#ef4444]" : "text-[#f87171]"
                    }`}
                  >
                    {item.stock === 0 ? "Tükendi" : `${item.stock} adet`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
