type ProductImageInput = {
  image?: string | null;
  images?: { url?: string | null }[] | null;
  name: string;
  slug?: string;
  categorySlug?: string;
};

const CATEGORY_UNSPLASH: Record<string, string> = {
  elektronik:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
  giyim:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
  "ev-ve-yasam":
    "https://images.unsplash.com/photo-1507473886341-58f686d3563b?auto=format&fit=crop&w=800&q=80",
  spor:
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=800&q=80",
  aksesuar:
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
};

const PRODUCT_UNSPLASH: Record<string, string> = {
  "novasound-pro-kulaklik":
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
  "titan-smart-watch":
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
  "airpulse-pro-kulaklik":
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=1200&q=80",
  "luna-oversize-kanka":
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80",
  "terra-denim-ceket":
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80",
  "motionflex-kosu-ayakkabisi":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
  "nordic-isik-masa-lambasi":
    "https://images.unsplash.com/photo-1507473886341-58f686d3563b?auto=format&fit=crop&w=1200&q=80",
  "cloudrest-ortopedik-yastik":
    "https://images.unsplash.com/photo-1631049307264-da14ec26d84d?auto=format&fit=crop&w=1200&q=80",
  "purebrew-filtre-kahve-makinesi":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
  "corepower-dambil-seti":
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=1200&q=80",
  "hydroboost-termal-matara":
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=1200&q=80",
  "urbancarry-deri-sirt-cantasi":
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80",
};

function placeholdUrl(name: string) {
  const label = encodeURIComponent(name.slice(0, 24) || "Ürün");
  return `https://placehold.co/400x400/1a1a2e/e2e8f0?text=${label}`;
}

export function getProductImageUrl(item: ProductImageInput): string {
  const fromImages = item.images?.[0]?.url?.trim();
  if (fromImages) return fromImages;

  const fromImage = item.image?.trim();
  if (fromImage) return fromImage;

  if (item.slug && PRODUCT_UNSPLASH[item.slug]) {
    return PRODUCT_UNSPLASH[item.slug];
  }

  if (item.categorySlug && CATEGORY_UNSPLASH[item.categorySlug]) {
    return CATEGORY_UNSPLASH[item.categorySlug];
  }

  return placeholdUrl(item.name);
}

export function getProductImageFallback(name: string) {
  return placeholdUrl(name);
}
