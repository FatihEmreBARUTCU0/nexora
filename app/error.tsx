"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-6 pb-24 pt-12 md:px-10">
      <div className="rounded-2xl border border-[#1f1f1f] bg-[#111111] px-8 py-12 text-center">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
          Bir hata oluştu
        </h1>
        <p className="mt-3 text-zinc-400">
          Sayfa yüklenirken beklenmeyen bir sorun oluştu.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center rounded-full bg-[#b44dff] px-8 py-3 text-sm font-medium text-white transition hover:bg-[#9f33ee]"
          >
            Tekrar Dene
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-[#2a2a2a] px-8 py-3 text-sm font-medium text-zinc-200 transition hover:border-[#b44dff] hover:text-white"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
