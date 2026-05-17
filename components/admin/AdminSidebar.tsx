"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderTree, LayoutDashboard, Menu, Package, ShoppingCart, X } from "lucide-react";
import { AdminSignOutButton } from "./AdminSignOutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin-products", label: "Ürünler", icon: Package },
  { href: "/admin-orders", label: "Siparişler", icon: ShoppingCart },
  { href: "/categories", label: "Kategoriler", icon: FolderTree },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#1f1f1f] bg-[#0d0d0d] px-4 md:hidden">
        <button
          type="button"
          aria-label="Menüyü aç"
          onClick={() => setIsOpen(true)}
          className="rounded-lg border border-[#262626] p-1.5 text-zinc-300 hover:text-white"
        >
          <Menu size={18} />
        </button>
        <Link href="/dashboard" className="text-base font-bold tracking-[-0.02em] text-white">
          Nexora Admin
        </Link>
      </div>

      {/* Backdrop */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[240px] border-r border-[#1f1f1f] bg-[#0d0d0d] p-5 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between md:block">
          <Link
            href="/dashboard"
            className="text-xl font-bold tracking-[-0.02em] text-white md:mb-8 md:block"
          >
            Nexora Admin
          </Link>
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setIsOpen(false)}
            className="rounded-lg border border-[#262626] p-1.5 text-zinc-400 hover:text-white md:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="mt-6 space-y-1 md:mt-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-[#151515] hover:text-white ${
                  isActive ? "bg-[#151515] text-white" : "text-zinc-400"
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <AdminSignOutButton />
        </div>
      </aside>
    </>
  );
}
