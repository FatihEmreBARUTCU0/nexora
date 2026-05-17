import type { Metadata } from "next";
import { Star } from "lucide-react";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ProductDetailGallery } from "@/components/product/ProductDetailGallery";
import { ProductVariantActions } from "@/components/product/ProductVariantActions";
import type { VariantGroup } from "@/components/product/ProductVariantActions";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

type ProductVariant = {
  name: string;
  value: string;
  stock: number;
};

type ProductResponse = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  brand?: string;
  ratings?: { avg?: number; count?: number };
  images?: { url: string }[];
  variants?: ProductVariant[];
};

async function fetchProduct(slug: string): Promise<ProductResponse | null> {
  try {
    const headerStore = await headers();
    const host = headerStore.get("host");
    const protocol = headerStore.get("x-forwarded-proto") ?? "http";

    if (!host) return null;

    const response = await fetch(`${protocol}://${host}/api/products?slug=${slug}&limit=1`, {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { products: ProductResponse[] };
    return data.products[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return { title: "Ürün Bulunamadı | Nexora" };
  }

  return {
    title: `${product.name} | Nexora`,
    description: product.description?.slice(0, 155) ?? `${product.name} - Nexora'da satın al.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 155),
      images: product.images?.[0]?.url ? [{ url: product.images[0].url }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    notFound();
  }

  const variantGroups: VariantGroup[] = (product.variants ?? []).reduce<VariantGroup[]>(
    (acc, variant) => {
      const existing = acc.find((g) => g.label === variant.name);
      if (existing) {
        if (!existing.values.includes(variant.value)) {
          existing.values.push(variant.value);
        }
      } else {
        acc.push({ label: variant.name, values: [variant.value] });
      }
      return acc;
    },
    []
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <ProductDetailGallery name={product.name} images={product.images} />

        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8">
          {product.brand ? (
            <p className="mb-2 text-sm text-zinc-500">{product.brand}</p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
            <Star size={16} className="fill-zinc-300 text-zinc-300" />
            <span>{(product.ratings?.avg ?? 0).toFixed(1)}</span>
            <span className="text-zinc-500">({product.ratings?.count ?? 0} değerlendirme)</span>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <p className="text-3xl font-semibold text-white">{product.price.toLocaleString("tr-TR")} TL</p>
            {product.comparePrice ? (
              <p className="text-lg text-zinc-500 line-through">
                {product.comparePrice.toLocaleString("tr-TR")} TL
              </p>
            ) : null}
          </div>

          {product.stock > 0 ? (
            <p className="mt-4 inline-flex rounded-full border border-[#22c55e33] bg-[#22c55e1a] px-3 py-1 text-sm text-[#86efac]">
              Stokta var ({product.stock} adet)
            </p>
          ) : (
            <p className="mt-4 inline-flex rounded-full border border-[#ef444433] bg-[#ef44441a] px-3 py-1 text-sm text-[#fca5a5]">
              Stok yok
            </p>
          )}

          <ProductVariantActions
            product={{
              productId: product._id,
              name: product.name,
              price: product.price,
              image: product.images?.[0]?.url ?? "",
              slug: product.slug,
            }}
            variantGroups={variantGroups}
          />
        </section>
      </div>

      <section className="mt-14 rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8">
        <div className="mb-5 flex items-center gap-6">
          <h2 className="text-xl font-medium text-white">Ürün Açıklaması</h2>
          <span className="h-px flex-1 bg-[#1f1f1f]" />
        </div>
        <p className="max-w-4xl leading-8 text-zinc-400">
          {product.description}
        </p>
      </section>
    </div>
  );
}
