import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-products", label: "Ürünler", icon: Package },
  { href: "/admin-orders", label: "Siparişler", icon: ShoppingCart },
  { href: "/categories", label: "Kategoriler", icon: FolderTree },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <div data-admin-layout="true" className="min-h-screen bg-[#0a0a0a]">
      <aside className="fixed inset-y-0 left-0 w-[240px] border-r border-[#1f1f1f] bg-[#0d0d0d] p-5">
        <Link href="/dashboard" className="mb-8 block text-xl font-bold tracking-[-0.02em] text-white">
          Nexora Admin
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 transition hover:bg-[#151515] hover:text-white"
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </nav>
        <AdminSignOutButton />
      </aside>

      <main className="ml-[240px] min-h-screen bg-[#0a0a0a] p-6 md:p-8">{children}</main>
    </div>
  );
}
