"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

type FavoriteButtonProps = {
  productId: string;
  productName: string;
  productSlug: string;
  productPrice: number;
  productImage?: string;
  inline?: boolean;
};

type FavoriteItem = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
};

const FAVORITES_STORAGE_KEY = "nexora-favorites";

export function FavoriteButton({
  productId,
  productName,
  productSlug,
  productPrice,
  productImage = "",
  inline = false,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (session?.user?.id && !synced) {
      (async () => {
        try {
          const response = await fetch("/api/favorites");
          if (response.ok) {
            const data = (await response.json()) as { favorites: FavoriteItem[] };
            setFavorites(data.favorites ?? []);
            localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(data.favorites ?? []));
          }
        } catch {
          const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
          if (raw) {
            try { setFavorites(JSON.parse(raw) as FavoriteItem[]); } catch { /* noop */ }
          }
        } finally {
          setSynced(true);
        }
      })();
    } else if (!session?.user?.id) {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (raw) {
        try { setFavorites(JSON.parse(raw) as FavoriteItem[]); } catch { /* noop */ }
      }
    }
  }, [session?.user?.id, synced]);

  const isFavorite = useMemo(
    () => favorites.some((f) => f.productId === productId),
    [favorites, productId]
  );

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isFavorite) {
      const next = favorites.filter((f) => f.productId !== productId);
      setFavorites(next);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
      toast("Favorilerden çıkarıldı", { icon: "ℹ️" });

      if (session?.user?.id) {
        await fetch(`/api/favorites?productId=${productId}`, { method: "DELETE" }).catch(() => {});
      }
      return;
    }

    const item: FavoriteItem = {
      productId,
      name: productName,
      slug: productSlug,
      image: productImage,
      price: productPrice,
    };
    const next = [...favorites, item];
    setFavorites(next);
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    toast.success("Favorilere eklendi!");

    if (session?.user?.id) {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      }).catch(() => {});
    }
  };

  if (inline) {
    return (
      <button
        type="button"
        aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
        onClick={(e) => void handleToggle(e)}
        className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm transition ${
          isFavorite
            ? "border-[#f43f5e55] bg-[#f43f5e11] text-[#f43f5e]"
            : "border-[#2a2a2a] text-zinc-300 hover:border-[#f43f5e55] hover:text-[#f43f5e]"
        }`}
      >
        <Heart size={15} className={isFavorite ? "fill-[#f43f5e]" : ""} />
        {isFavorite ? "Favoriden Çıkar" : "Favoriye Ekle"}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
      onClick={(e) => void handleToggle(e)}
      className="absolute right-3 top-3 z-10 rounded-full border border-[#2a2a2a] bg-[#0a0a0a]/80 p-2 text-zinc-300 opacity-0 transition hover:text-white group-hover:opacity-100"
    >
      <Heart size={15} className={isFavorite ? "fill-[#f43f5e] text-[#f43f5e]" : ""} />
    </button>
  );
}
