"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SearchProduct = {
  _id: string;
  name: string;
  price: number;
  slug: string;
};

export function AISearchBar() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = (await response.json()) as { products?: SearchProduct[]; error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? `AI arama başarısız (${response.status}).`);
      }

      setResults(data.products ?? []);
      setIsResultsOpen(true);
    } catch (searchError) {
      const message =
        searchError instanceof Error
          ? searchError.message
          : "AI arama şu anda kullanılamıyor.";
      setError(message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSearch} className="mt-10 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="örn. 500 TL altı bluetooth kulaklık..."
          className="w-full rounded-full border border-[#2c2c2c] bg-[#0d0d0d] px-6 py-4 text-sm text-white placeholder:text-zinc-500 focus:border-[#6366f1] focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#6366f1] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8] disabled:opacity-70"
        >
          {loading ? "Aranıyor..." : "Ara"} <ArrowRight size={16} />
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
      {isResultsOpen ? (
        <div
          className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
          onClick={(event) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
              setIsResultsOpen(false);
            }
          }}
        >
          <div
            ref={modalRef}
            className="mx-auto mt-24 w-full max-w-2xl rounded-2xl border border-[#2a2a2a] bg-[#111111] p-5 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Akıllı Arama Sonuçları</h3>
              <button
                type="button"
                onClick={() => setIsResultsOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Kapat
              </button>
            </div>
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.slice(0, 8).map((product) => (
                  <Link
                    key={product._id}
                    href={`/products/${product.slug}`}
                    onClick={() => setIsResultsOpen(false)}
                    className="flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 transition hover:border-[#6366f1]"
                  >
                    <div className="h-10 w-10 rounded-md border border-[#1f1f1f] bg-gradient-to-b from-[#1a1a2b] to-[#0f0f16]" />
                    <div>
                      <p className="text-sm text-white">{product.name}</p>
                      <p className="mt-1 text-xs text-zinc-400">{product.price.toLocaleString("tr-TR")} TL</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-zinc-400">Sonuç bulunamadı.</p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
