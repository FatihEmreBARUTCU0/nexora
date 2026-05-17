import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { releaseStock, reverseSale } from "@/lib/stock";
import Order from "@/models/Order";

type OrderRouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled", "failed"] as const;

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled", "failed"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: ["cancelled"],
  cancelled: [],
  failed: [],
};

const STOCK_RESTORE_STATUSES = new Set(["paid", "shipped", "delivered"]);

export async function PATCH(request: NextRequest, context: OrderRouteContext) {
  try {
    const authResult = await requireAdmin(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    await connectDB();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };

    if (!body.status || !ALLOWED_STATUSES.includes(body.status as (typeof ALLOWED_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
    }

    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const allowedNext = VALID_TRANSITIONS[existingOrder.status] ?? [];
    if (!allowedNext.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status transition." }, { status: 400 });
    }

    const previousStatus = existingOrder.status;
    existingOrder.status = body.status as typeof existingOrder.status;
    await existingOrder.save();

    if (body.status === "cancelled") {
      for (const item of existingOrder.items) {
        const productId = item.product.toString();
        if (STOCK_RESTORE_STATUSES.has(previousStatus)) {
          await reverseSale(productId, item.qty);
        } else if (previousStatus === "pending") {
          await releaseStock(productId, item.qty);
        }
      }
    }

    if (body.status === "failed" && previousStatus === "pending") {
      for (const item of existingOrder.items) {
        await releaseStock(item.product.toString(), item.qty);
      }
    }

    return NextResponse.json({ order: existingOrder.toObject() });
  } catch (error) {
    console.error("Order PATCH error:", error);
    return NextResponse.json({ error: "Failed to update order." }, { status: 500 });
  }
}
