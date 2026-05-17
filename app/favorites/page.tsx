"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";

type FavoriteItem = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
};

export default function FavoritesPage() {
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (session?.user?.id) {
          const response = await fetch("/api/favorites");
          if (response.ok) {
            const data = (await response.json()) as { favorites: FavoriteItem[] };
            setFavorites(data.favorites ?? []);
            return;
          }
        }
        const raw = localStorage.getItem("nexora-favorites");
        if (raw) {
          const parsed = JSON.parse(raw) as FavoriteItem[];
          setFavorites(Array.isArray(parsed) ? parsed : []);
        }
      } catch {
        const raw = localStorage.getItem("nexora-favorites");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as FavoriteItem[];
            setFavorites(Array.isArray(parsed) ? parsed : []);
          } catch { /* noop */ }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id]);

  const removeFavorite = async (productId: string) => {
    const nextFavorites = favorites.filter((item) => item.productId !== productId);
    setFavorites(nextFavorites);
    localStorage.setItem("nexora-favorites", JSON.stringify(nextFavorites));
    toast("Favorilerden çıkarıldı", { icon: "ℹ️" });

    if (session?.user?.id) {
      await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 text-zinc-400 md:px-10">
        Favoriler yükleniyor...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Favorilerim</h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
        {favorites.length > 0 && (
          <span className="text-sm text-zinc-500">{favorites.length} ürün</span>
        )}
      </div>

      {favorites.length === 0 ? (
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-10 text-center">
          <p className="text-lg text-zinc-300">Henüz favori ürün yok</p>
          <p className="mt-2 text-sm text-zinc-500">
            {session?.user?.id
              ? "Beğendiğin ürünleri favorile, her yerden eriş."
              : "Giriş yaparak favorilerin kaydedilsin."}
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full bg-[#6366f1] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5458e8]"
          >
            Ürünleri Keşfet
          </Link>
        </section>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favorites.map((item) => (
            <article key={item.productId} className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5">
              <Link href={`/products/${item.slug}`} className="block">
                <div className="relative mb-4 h-52 overflow-hidden rounded-xl border border-[#1f1f1f] bg-[#0d0d0d]">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1280px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-b from-[#1a1a2b] to-[#0f0f16]" />
                  )}
                </div>
                <h2 className="text-lg font-medium text-white">{item.name}</h2>
                <p className="mt-2 text-zinc-300">{item.price.toLocaleString("tr-TR")} TL</p>
              </Link>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    addToCart(
                      {
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        image: item.image,
                        slug: item.slug,
                      },
                      1
                    );
                    toast.success("Ürün sepete eklendi!");
                  }}
                  className="rounded-full bg-[#6366f1] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#5458e8]"
                >
                  Sepete Ekle
                </button>
                <button
                  type="button"
                  onClick={() => void removeFavorite(item.productId)}
                  className="rounded-full border border-[#2a2a2a] px-5 py-2 text-sm text-zinc-200 transition hover:border-[#ef444466] hover:text-[#fca5a5]"
                >
                  Kaldır
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
