import Link from "next/link";
import { headers } from "next/headers";
import type { ComponentType } from "react";
import { Folder, Shirt, Smartphone, Sparkles, Star, Waves } from "lucide-react";

type CategoryItem = {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
};

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  elektronik: Smartphone,
  giyim: Shirt,
  "ev-ve-yasam": Sparkles,
  spor: Waves,
  aksesuar: Star,
};

async function getCategories() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) return [] as CategoryItem[];

  const response = await fetch(`${protocol}://${host}/api/categories`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch categories.");
  }

  const data = (await response.json()) as { categories: CategoryItem[] };
  return data.categories;
}

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 flex items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
          Kategoriler
        </h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = iconMap[category.slug] ?? Folder;
          return (
            <Link
              key={category._id}
              href={`/products?category=${category.slug}`}
              className="group rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 transition hover:-translate-y-1 hover:border-[#6366f1] hover:shadow-[0_0_28px_rgba(99,102,241,0.2)]"
            >
              <Icon className="mb-6 text-zinc-300 transition group-hover:text-[#6366f1]" size={28} />
              <h2 className="text-xl font-medium text-white">{category.name}</h2>
              <p className="mt-2 text-sm text-zinc-400">{category.productCount} ürün</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
