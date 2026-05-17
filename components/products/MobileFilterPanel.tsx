"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { ProductsFilters } from "@/components/products/ProductsFilters";

type MobileFilterPanelProps = {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

export function MobileFilterPanel(props: MobileFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 text-sm text-zinc-300 hover:border-[#6366f1] hover:text-white"
      >
        <SlidersHorizontal size={15} />
        Filtrele
        {props.category || props.minPrice || props.maxPrice ? (
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#6366f1] text-[10px] text-white">
            ●
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="flex-1 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div className="flex w-[300px] flex-col overflow-y-auto border-l border-[#1f1f1f] bg-[#0d0d0d]">
            <div className="flex items-center justify-between border-b border-[#1f1f1f] px-5 py-4">
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-white">Filtreler</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-white"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <ProductsFilters {...props} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
