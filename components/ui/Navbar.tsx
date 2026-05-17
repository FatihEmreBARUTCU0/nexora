"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { href: "/", label: "Ana Sayfa" },
  { href: "/products", label: "Ürünler" },
  { href: "/categories", label: "Kategoriler" },
  { href: "/orders", label: "Siparişlerim" },
];

export function Navbar() {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const { data: session } = useSession();
  const userInitial = session?.user?.name?.charAt(0).toUpperCase() ?? "U";
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<
    { _id: string; slug: string; name: string; price: number; images?: { url: string }[] }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchModalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (event.target instanceof Node && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchTerm)}&limit=6`, {
          cache: "no-store",
        });
        if (!response.ok) {
          setSearchResults([]);
          return;
        }
        const data = (await response.json()) as {
          products: { _id: string; slug: string; name: string; price: number; images?: { url: string }[] }[];
        };
        setSearchResults(data.products ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isSearchOpen, searchTerm]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1f1f1f] bg-[#080808]/70 shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-10">
          <Link href="/" className="text-2xl font-bold tracking-[-0.03em] text-white">
            NEXORA
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm text-zinc-300 hover:text-white"
              >
                {link.label}
                <span
                  className={`absolute -bottom-2 left-0 h-px w-full origin-left bg-white transition-transform duration-300 ${
                    pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label={isMobileNavOpen ? "Menüyü kapat" : "Menüyü aç"}
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="text-zinc-300 hover:text-white md:hidden"
          >
            {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button
            type="button"
            aria-label="Ara"
            onClick={() => setIsSearchOpen(true)}
            className="text-zinc-300 hover:text-white"
          >
            <Search size={20} />
          </button>
          <Link href="/cart" aria-label="Sepet" className="relative text-zinc-300 hover:text-white">
            <ShoppingBag size={20} />
            {totalItems > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6a00] px-1 text-[10px] font-medium text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>
          {session?.user ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                aria-label="Kullanıcı menüsü"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-xs font-medium text-white"
              >
                {userInitial}
              </button>
              <div
                className={`absolute right-0 top-11 z-50 w-44 rounded-xl border border-[#2a2a2a] bg-[#111111] p-2 transition ${
                  isMenuOpen ? "visible opacity-100" : "invisible opacity-0"
                }`}
              >
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  Profilim
                </Link>
                <Link
                  href="/favorites"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  Favorilerim
                </Link>
                <Link
                  href="/orders"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  Siparişlerim
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void signOut({ callbackUrl: "/" });
                  }}
                  className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  Çıkış
                </button>
              </div>
            </div>
          ) : (
            <Link href="/auth/login" aria-label="Giriş yap" className="text-zinc-300 hover:text-white">
              <User size={20} />
            </Link>
          )}
        </div>
      </div>
      {isMobileNavOpen ? (
        <nav className="border-t border-[#1f1f1f] bg-[#080808] px-6 py-4 md:hidden">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-sm transition ${
                    pathname === link.href
                      ? "bg-[#1a1a1a] text-white"
                      : "text-zinc-300 hover:bg-[#141414] hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {isSearchOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
          onClick={(event) => {
            if (searchModalRef.current && !searchModalRef.current.contains(event.target as Node)) {
              setIsSearchOpen(false);
            }
          }}
        >
          <div ref={searchModalRef} className="mx-4 mt-16 w-full max-w-2xl rounded-2xl border border-[#2a2a2a] bg-[#111111] p-4 shadow-2xl sm:mx-auto sm:mt-24 sm:p-5">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ürün ara..."
              autoFocus
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
            />
            <div className="mt-4 max-h-[360px] overflow-y-auto">
              {isSearching ? (
                <p className="px-2 py-4 text-sm text-zinc-400">Aranıyor...</p>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((item) => (
                    <Link
                      key={item._id}
                      href={`/products/${item.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-3 transition hover:border-[#b44dff]"
                    >
                      <div className="h-12 w-12 rounded-lg border border-[#1f1f1f] bg-gradient-to-b from-[#1a1a2b] to-[#0f0f16]" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{item.name}</p>
                        <p className="text-xs text-zinc-400">{item.price.toLocaleString("tr-TR")} TL</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="px-2 py-4 text-sm text-zinc-400">
                  {searchTerm.trim() ? "Sonuç bulunamadı." : "Aramak için ürün adı yazın."}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
