import Link from "next/link";
import { AISearchBar } from "@/components/ai/AISearchBar";
import { RecommendationsWidget } from "@/components/ai/RecommendationsWidget";
import { FeaturedProductsGrid } from "@/components/home/FeaturedProductsGrid";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import {
  ArrowRight,
  Shirt,
  Smartphone,
  Sparkles,
  Star,
  Watch,
  Waves,
} from "lucide-react";

const categories = [
  { name: "Elektronik", icon: Smartphone },
  { name: "Ev ve Yaşam", icon: Sparkles },
  { name: "Giyim", icon: Shirt },
  { name: "Spor", icon: Waves },
  { name: "Kişisel Bakım", icon: Star },
  { name: "Aksesuar", icon: Watch },
] as const;

type FeaturedProduct = {
  _id: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  brand?: string;
  sold?: number;
  ratings?: { avg?: number };
  images?: { url: string }[];
  slug: string;
};

async function getFeaturedProducts(): Promise<FeaturedProduct[]> {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .sort({ sold: -1 })
      .limit(4)
      .select("_id name price comparePrice brand sold ratings images slug")
      .lean<FeaturedProduct[]>();
    return products;
  } catch (error) {
    console.error("Featured products fetch error:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="bg-[#080808]">
      <section className="mx-auto w-full max-w-7xl px-6 pb-[120px] pt-24 md:px-10 md:pt-28">
        <div className="rounded-[24px] border border-[#1a1a1a] bg-[radial-gradient(circle_at_50%_24%,#1a1a2e_0%,#0a0a0a_62%,#0a0a0a_100%)] px-6 py-12 md:rounded-[36px] md:px-14 md:py-20">
          <p className="mb-8 inline-flex rounded-full border border-[#7c7ff833] bg-[#1d1e35]/70 px-4 py-2 text-xs tracking-[0.16em] text-zinc-200 backdrop-blur-xl shadow-[0_0_22px_rgba(99,102,241,0.22)]">
          AI destekli · 10.000+ ürün
          </p>
          <h1 className="max-w-5xl text-[42px] font-bold leading-[1.05] tracking-[-0.04em] text-white sm:text-[58px] md:text-[80px] lg:text-[108px] lg:leading-[0.98] lg:tracking-[-0.05em]">
            Yeni nesil <span className="text-[#6366f1]">alışveriş</span> deneyimi.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-400 md:mt-10 md:text-xl md:leading-9">
            Nexora ile premium ürünleri sakin, modern ve hızlı bir arayüzde keşfet.
            Minimal tasarım, maksimum odak.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link
              href="/products"
              className="rounded-full bg-[#6366f1] px-8 py-4 text-sm font-medium text-white transition hover:bg-[#565ae5]"
            >
              Alışverişe Başla
            </Link>
            <Link
              href="/categories"
              className="rounded-full border border-[#2f2f2f] bg-transparent px-8 py-4 text-sm font-medium text-white transition hover:border-[#6366f1aa] hover:text-[#c7d2fe]"
            >
              Kategorileri Keşfet
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-[120px] md:px-10">
        <div className="mb-10 flex items-center gap-6">
          <h2 className="text-2xl font-medium text-white md:text-3xl">Kategoriler</h2>
          <span className="h-px flex-1 bg-[#1f1f1f]" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <article
              key={category.name}
              className="group rounded-2xl border border-[#1f1f1f] bg-[#111111] p-10 transition hover:border-l-[#6366f1] hover:[border-left-width:3px]"
            >
              <category.icon
                className="mb-8 text-zinc-300 transition group-hover:text-[#6366f1]"
                size={26}
              />
              <p className="text-xl font-medium text-white">{category.name}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-[120px] md:px-10">
        <div className="mb-10 flex items-center gap-6">
          <h2 className="text-2xl font-medium text-white md:text-3xl">
            Öne Çıkan Ürünler
          </h2>
          <span className="h-px flex-1 bg-[#1f1f1f]" />
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
          >
            Tümünü Gör <ArrowRight size={16} />
          </Link>
        </div>
        <FeaturedProductsGrid products={featuredProducts} />
      </section>

      <RecommendationsWidget />

      <section className="mx-auto w-full max-w-7xl px-6 pb-[140px] md:px-10">
        <div className="rounded-[28px] bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#9333ea] p-[1px]">
          <div className="rounded-[27px] bg-[#111111] px-8 py-16 md:px-14">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-[#6366f1]">
            AI Destekli Deneyim
          </p>
          <h2 className="max-w-3xl text-2xl font-semibold tracking-[-0.03em] text-white sm:text-4xl md:text-6xl">
            Akıllı Arama ile Ara
          </h2>
          <p className="mt-6 max-w-2xl text-lg text-zinc-400">
            İstediğin ürünü doğal dille tarif et, Nexora AI senin için en doğru
            sonuçları anında öne çıkarsın.
          </p>
          <AISearchBar />
          </div>
        </div>
      </section>
    </div>
  );
}
