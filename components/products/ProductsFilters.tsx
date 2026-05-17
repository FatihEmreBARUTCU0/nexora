"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  { label: "Elektronik", value: "elektronik" },
  { label: "Giyim", value: "giyim" },
  { label: "Ev ve Yaşam", value: "ev-ve-yasam" },
  { label: "Aksesuar", value: "aksesuar" },
];

const SLIDER_MIN = 0;
const SLIDER_MAX = 10000;
const SLIDER_STEP = 100;

type ProductsFiltersProps = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

function parseMaxPrice(value: string | undefined): number {
  const parsed = Number(value ?? SLIDER_MAX);
  if (!Number.isFinite(parsed)) return SLIDER_MAX;
  return Math.min(SLIDER_MAX, Math.max(SLIDER_MIN, parsed));
}

export function ProductsFilters({ category, minPrice, maxPrice, sort }: ProductsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDraggingPrice = useRef(false);

  const selectedMinPrice = minPrice ?? String(SLIDER_MIN);
  const selectedSort = sort ?? "newest";
  const committedMaxPrice = parseMaxPrice(maxPrice);

  const localMaxPriceRef = useRef(committedMaxPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(committedMaxPrice);

  useEffect(() => {
    localMaxPriceRef.current = localMaxPrice;
  }, [localMaxPrice]);

  useEffect(() => {
    if (!isDraggingPrice.current) {
      setLocalMaxPrice(committedMaxPrice);
      localMaxPriceRef.current = committedMaxPrice;
    }
  }, [committedMaxPrice]);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  const commitMaxPrice = useCallback(
    (value: number) => {
      isDraggingPrice.current = false;
      updateQuery({
        minPrice: minPrice ?? null,
        maxPrice: value >= SLIDER_MAX ? null : String(value),
      });
    },
    [minPrice, updateQuery]
  );

  useEffect(() => {
    const handleWindowPointerUp = () => {
      if (!isDraggingPrice.current) return;
      commitMaxPrice(localMaxPriceRef.current);
    };

    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => window.removeEventListener("pointerup", handleWindowPointerUp);
  }, [commitMaxPrice]);

  const handleCategoryToggle = (value: string) => {
    updateQuery({ category: category === value ? null : value });
  };

  const handlePricePointerDown = () => {
    isDraggingPrice.current = true;
  };

  const handlePriceInput = (event: React.FormEvent<HTMLInputElement>) => {
    setLocalMaxPrice(Number(event.currentTarget.value));
  };

  const handlePricePointerUp = () => {
    if (!isDraggingPrice.current) return;
    commitMaxPrice(localMaxPriceRef.current);
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-zinc-200">Kategori</h2>
        <div className="space-y-3">
          {categories.map((item) => {
            const isSelected = category === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => handleCategoryToggle(item.value)}
                className="flex w-full items-center gap-3 text-left text-sm text-zinc-300 transition hover:text-white"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-[#b44dff] bg-[#b44dff]"
                      : "border-zinc-500 bg-transparent"
                  }`}
                  aria-hidden
                >
                  {isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => updateQuery({ category: null })}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Kategori filtresini temizle
          </button>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-medium text-zinc-200">Fiyat Aralığı</h2>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={SLIDER_STEP}
          value={localMaxPrice}
          onInput={handlePriceInput}
          onChange={handlePriceInput}
          onMouseDown={handlePricePointerDown}
          onTouchStart={handlePricePointerDown}
          onPointerDown={handlePricePointerDown}
          onMouseUp={handlePricePointerUp}
          onTouchEnd={handlePricePointerUp}
          onPointerUp={handlePricePointerUp}
          className="w-full cursor-pointer accent-[#b44dff]"
          style={{ touchAction: "none" }}
        />
        <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
          <span>{Number(selectedMinPrice).toLocaleString("tr-TR")} TL</span>
          <span>{localMaxPrice.toLocaleString("tr-TR")} TL</span>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-medium text-zinc-200">Sıralama</h2>
        <select
          value={selectedSort}
          onChange={(event) => updateQuery({ sort: event.target.value })}
          className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white focus:border-[#b44dff] focus:outline-none"
        >
          <option value="newest">En Yeni</option>
          <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
          <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
          <option value="rating_desc">Puan: Yüksekten Düşüğe</option>
        </select>
      </div>
    </>
  );
}
