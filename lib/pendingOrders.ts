import { releaseStock } from "@/lib/stock";
import Order from "@/models/Order";

const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000;

export async function expireStalePendingOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MS);

  const staleOrders = await Order.find({
    status: "pending",
    createdAt: { $lt: cutoff },
  });

  for (const order of staleOrders) {
    for (const item of order.items) {
      await releaseStock(item.product.toString(), item.qty);
    }
    order.status = "failed";
    await order.save();
  }

  return staleOrders.length;
}
