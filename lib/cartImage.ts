import type { CartItem } from "@/context/CartContext";
import { getProductImageUrl } from "@/lib/productImage";

export function getCartItemImageUrl(item: Pick<CartItem, "image" | "name" | "slug" | "productId">): string {
  return getProductImageUrl({
    image: item.image,
    name: item.name,
    slug: item.slug,
  });
}
