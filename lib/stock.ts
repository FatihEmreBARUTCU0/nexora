import Product from "@/models/Product";

type ReservedProduct = {
  _id: { toString(): string };
  name: string;
  price: number;
  stock: number;
  images?: { url: string }[];
};

export async function reserveStock(
  productId: string,
  qty: number
): Promise<ReservedProduct | null> {
  return Product.findOneAndUpdate(
    { _id: productId, isActive: true, stock: { $gte: qty } },
    { $inc: { stock: -qty } },
    { new: true }
  )
    .select("_id name price stock images")
    .lean<ReservedProduct | null>();
}

export async function releaseStock(productId: string, qty: number): Promise<void> {
  await Product.findByIdAndUpdate(productId, { $inc: { stock: qty } });
}

export async function confirmSale(productId: string, qty: number): Promise<void> {
  await Product.findByIdAndUpdate(productId, { $inc: { sold: qty } });
}

export async function reverseSale(productId: string, qty: number): Promise<void> {
  await Product.findByIdAndUpdate(productId, {
    $inc: { stock: qty, sold: -qty },
  });
}
