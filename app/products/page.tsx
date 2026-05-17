import Link from "next/link";
import Image from "next/image";
import { SlidersHorizontal } from "lucide-react";
import { headers } from "next/headers";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ProductsFilters } from "@/components/products/ProductsFilters";

const imageGradients = [
  "from-[#0d0d1a] to-[#17172b]",
  "from-[#0a1628] to-[#10243a]",
  "from-[#0a1a0f] to-[#143020]",
  "from-[#1a0f00] to-[#2b1a06]",
];

type ApiProduct = {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  ratings?: { avg?: number };
  brand?: string;
  images?: { url: string }[];
};

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

async function getProducts(filters: {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}) {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return [] as ApiProduct[];
  }

  const query = new URLSearchParams({ limit: "12", sort: filters.sort ?? "newest" });
  if (filters.category) query.set("category", filters.category);
  if (filters.minPrice) query.set("minPrice", filters.minPrice);
  if (filters.maxPrice) query.set("maxPrice", filters.maxPrice);

  const response = await fetch(`${protocol}://${host}/api/products?${query.toString()}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch products.");
  }

  const data = (await response.json()) as { products: ApiProduct[] };
  return data.products;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = await searchParams;
  const products = await getProducts(resolvedSearchParams);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 flex items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
          Ürünler
        </h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6">
          <div className="mb-8 flex items-center gap-2 text-white">
            <SlidersHorizontal size={16} />
            <p className="text-sm font-medium uppercase tracking-[0.15em]">Filtreler</p>
          </div>
          <ProductsFilters
            category={resolvedSearchParams.category}
            minPrice={resolvedSearchParams.minPrice}
            maxPrice={resolvedSearchParams.maxPrice}
            sort={resolvedSearchParams.sort}
          />
        </aside>

        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-zinc-400">{products.length} ürün bulundu</p>
            <p className="text-sm text-zinc-400">
              Sıralama: <span className="text-zinc-200">{resolvedSearchParams.sort ?? "newest"}</span>
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => (
              <Link key={product._id} href={`/products/${product.slug}`}>
                <article className="group rounded-2xl border border-[#1f1f1f] bg-[#111111] p-5 transition hover:-translate-y-1 hover:border-[#6366f1] hover:shadow-[0_0_24px_rgba(99,102,241,0.2)]">
                  <div
                    className={`relative mb-5 min-h-[280px] rounded-xl border border-[#1f1f1f] bg-gradient-to-b ${
                      imageGradients[index % imageGradients.length]
                    } p-4`}
                  >
                    {product.images?.[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="rounded-xl object-cover"
                        sizes="(max-width: 1200px) 50vw, 33vw"
                      />
                    ) : null}
                    <p className="relative z-10 inline-flex rounded-full border border-[#2a2a2a] bg-[#0b0b0b]/80 px-3 py-1 text-xs text-zinc-200">
                      {product.brand ?? "Nexora"}
                    </p>
                    <FavoriteButton
                      productId={product._id}
                      productName={product.name}
                      productSlug={product.slug}
                      productPrice={product.price}
                      productImage={product.images?.[0]?.url}
                    />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-white">{product.name}</h3>
                  <p className="mt-2 text-sm text-zinc-400">⭐ {(product.ratings?.avg ?? 0).toFixed(1)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="text-xl font-semibold text-white">{product.price.toLocaleString("tr-TR")} TL</p>
                    {product.comparePrice ? (
                      <p className="text-sm text-zinc-500 line-through">
                        {product.comparePrice.toLocaleString("tr-TR")} TL
                      </p>
                    ) : null}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
