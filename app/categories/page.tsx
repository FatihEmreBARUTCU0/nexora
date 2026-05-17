import Link from "next/link";
import type { ComponentType } from "react";
import { Folder, Shirt, Smartphone, Sparkles, Star, Waves } from "lucide-react";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

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

async function getCategories(): Promise<CategoryItem[]> {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select("_id name slug")
      .lean<{ _id: unknown; name: string; slug: string }[]>();

    const results = await Promise.all(
      categories.map(async (cat) => {
        const productCount = await Product.countDocuments({
          category: cat._id,
          isActive: true,
        });
        return {
          _id: String(cat._id),
          name: cat.name,
          slug: cat.slug,
          productCount,
        };
      })
    );

    return results;
  } catch {
    return [];
  }
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
              className="group rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 transition hover:-translate-y-1 hover:border-[#ff6a00] hover:shadow-[0_0_28px_rgba(255,106,0,0.2)]"
            >
              <Icon className="mb-6 text-zinc-300 transition group-hover:text-[#ff6a00]" size={28} />
              <h2 className="text-xl font-medium text-white">{category.name}</h2>
              <p className="mt-2 text-sm text-zinc-400">{category.productCount} ürün</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
