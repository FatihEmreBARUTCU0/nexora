import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { assertSeedSecretConfigured } from "@/lib/seedCredentials";
import Category from "@/models/Category";
import Product from "@/models/Product";

type SeedCategory = {
  name: string;
  slug: string;
};

type SeedProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number;
  stock: number;
  sold: number;
  brand: string;
  ratings: {
    avg: number;
    count: number;
  };
  categorySlug: string;
};

const categoriesToSeed: SeedCategory[] = [
  { name: "Elektronik", slug: "elektronik" },
  { name: "Giyim", slug: "giyim" },
  { name: "Ev & Yaşam", slug: "ev-ve-yasam" },
  { name: "Aksesuar", slug: "aksesuar" },
];

const productsToSeed: SeedProduct[] = [
  {
    name: "Nexora Pulse ANC Kablosuz Kulaklık",
    slug: "nexora-pulse-anc-kablosuz-kulaklik",
    description:
      "Gün boyu konforlu kullanım sunan, aktif gürültü engelleme özellikli premium kulaklık.",
    price: 6499,
    comparePrice: 7499,
    stock: 28,
    sold: 142,
    brand: "Nexora",
    ratings: { avg: 4.7, count: 318 },
    categorySlug: "elektronik",
  },
  {
    name: "Lumen View 32 inç 2K Monitör",
    slug: "lumen-view-32-inc-2k-monitor",
    description:
      "Tasarım ve oyun için ideal, yüksek yenileme hızına sahip canlı renkli 2K monitör.",
    price: 9799,
    comparePrice: 10999,
    stock: 16,
    sold: 87,
    brand: "Lumen",
    ratings: { avg: 4.6, count: 201 },
    categorySlug: "elektronik",
  },
  {
    name: "Arc Mini Akıllı Hoparlör",
    slug: "arc-mini-akilli-hoparlor",
    description:
      "Kompakt boyutta güçlü ses sunan, sesli asistan destekli şık akıllı hoparlör.",
    price: 3299,
    comparePrice: 3899,
    stock: 34,
    sold: 233,
    brand: "Arc",
    ratings: { avg: 4.5, count: 412 },
    categorySlug: "elektronik",
  },
  {
    name: "Nordic Oversize Hoodie",
    slug: "nordic-oversize-hoodie",
    description:
      "Yumuşak dokulu kumaşı ve modern kesimiyle günlük kombinlere uyum sağlayan hoodie.",
    price: 1499,
    comparePrice: 1799,
    stock: 52,
    sold: 196,
    brand: "Nordic",
    ratings: { avg: 4.4, count: 265 },
    categorySlug: "giyim",
  },
  {
    name: "Motion Core Koşu Ayakkabısı",
    slug: "motion-core-kosu-ayakkabisi",
    description:
      "Hafif taban yapısı ve nefes alabilen üst yüzeyiyle uzun koşular için tasarlanmıştır.",
    price: 2399,
    comparePrice: 2899,
    stock: 41,
    sold: 174,
    brand: "Motion",
    ratings: { avg: 4.6, count: 307 },
    categorySlug: "giyim",
  },
  {
    name: "Urban Flex Kargo Pantolon",
    slug: "urban-flex-kargo-pantolon",
    description:
      "Esnek kumaş yapısı ve çok cepli tasarımıyla şehir yaşamı için işlevsel bir seçenek.",
    price: 1299,
    comparePrice: 1599,
    stock: 47,
    sold: 122,
    brand: "Urban",
    ratings: { avg: 4.3, count: 184 },
    categorySlug: "giyim",
  },
  {
    name: "Aura Seramik Kahve Makinesi",
    slug: "aura-seramik-kahve-makinesi",
    description:
      "Tek tuşla pratik kullanım sağlayan, mutfak dekoruna uyumlu kompakt kahve makinesi.",
    price: 4299,
    comparePrice: 4999,
    stock: 22,
    sold: 95,
    brand: "Aura",
    ratings: { avg: 4.7, count: 173 },
    categorySlug: "ev-ve-yasam",
  },
  {
    name: "Natura Bamboo 6'lı Saklama Seti",
    slug: "natura-bamboo-6li-saklama-seti",
    description:
      "Mutfakta düzen sağlayan, sızdırmaz kapaklı ve dayanıklı bambu detaylı saklama seti.",
    price: 899,
    comparePrice: 1199,
    stock: 63,
    sold: 211,
    brand: "Natura",
    ratings: { avg: 4.5, count: 288 },
    categorySlug: "ev-ve-yasam",
  },
  {
    name: "Liva Soft Touch Çift Kişilik Nevresim",
    slug: "liva-soft-touch-cift-kisilik-nevresim",
    description:
      "Nefes alabilen kumaşı ve yumuşak yüzeyiyle konforlu bir uyku deneyimi sunar.",
    price: 1899,
    comparePrice: 2299,
    stock: 37,
    sold: 144,
    brand: "Liva",
    ratings: { avg: 4.6, count: 192 },
    categorySlug: "ev-ve-yasam",
  },
  {
    name: "Titan Steel Akıllı Saat Kayışı",
    slug: "titan-steel-akilli-saat-kayisi",
    description:
      "Paslanmaz çelik malzemeden üretilmiş, kolay takılıp çıkarılabilen şık saat kayışı.",
    price: 699,
    comparePrice: 899,
    stock: 75,
    sold: 264,
    brand: "Titan",
    ratings: { avg: 4.4, count: 329 },
    categorySlug: "aksesuar",
  },
  {
    name: "Neo Carry Su Geçirmez Sırt Çantası",
    slug: "neo-carry-su-gecirmez-sirt-cantasi",
    description:
      "Günlük kullanım ve kısa seyahatler için ideal, laptop bölmeli su geçirmez sırt çantası.",
    price: 1699,
    comparePrice: 2099,
    stock: 39,
    sold: 157,
    brand: "Neo",
    ratings: { avg: 4.6, count: 238 },
    categorySlug: "aksesuar",
  },
  {
    name: "Minimal Deri Kartlık Cüzdan",
    slug: "minimal-deri-kartlik-cuzdan",
    description:
      "İnce formu sayesinde ceplerde rahat taşınan, gerçek deri yüzeyli kartlık cüzdan.",
    price: 549,
    comparePrice: 749,
    stock: 83,
    sold: 301,
    brand: "Minimal",
    ratings: { avg: 4.5, count: 356 },
    categorySlug: "aksesuar",
  },
];

export async function GET() {
  return NextResponse.json(
    { success: false, message: "Method not allowed. Use POST with x-seed-token header." },
    { status: 405 }
  );
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { success: false, message: "Seed route is only available in development." },
      { status: 403 }
    );
  }

  try {
    assertSeedSecretConfigured();
  } catch {
    return NextResponse.json(
      { success: false, message: "SEED_SECRET is not configured securely." },
      { status: 503 }
    );
  }

  const seedSecret = process.env.SEED_SECRET!.trim();
  const providedToken = request.headers.get("x-seed-token");

  if (providedToken !== seedSecret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    await connectDB();

    await Product.deleteMany({});
    await Category.deleteMany({});

    const createdCategories = await Category.insertMany(categoriesToSeed);
    const categoryIdBySlug = new Map(createdCategories.map((category) => [category.slug, category._id]));

    const seededProducts = productsToSeed.map((product) => ({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      stock: product.stock,
      sold: product.sold,
      brand: product.brand,
      ratings: product.ratings,
      category: categoryIdBySlug.get(product.categorySlug),
      images: [
        {
          url: `https://placehold.co/1200x1200/111111/ffffff?text=${encodeURIComponent(product.name)}`,
          publicId: `seed-${product.slug}`,
        },
      ],
      isActive: true,
    }));

    await Product.insertMany(seededProducts);

    return NextResponse.json({
      success: true,
      message: "Seed işlemi tamamlandı. 4 kategori ve 12 ürün eklendi.",
    });
  } catch (error) {
    console.error("Seed route error:", error);
    return NextResponse.json(
      { success: false, message: "Seed işlemi sırasında hata oluştu." },
      { status: 500 }
    );
  }
}
