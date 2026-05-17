import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (hasAuthError(authResult)) return authResult.response;

    await connectDB();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenueResult,
      monthRevenueResult,
      todayOrdersCount,
      totalProductsCount,
      pendingOrdersCount,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      Order.aggregate<{ _id: null; total: number }>([
        { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.aggregate<{ _id: null; total: number }>([
        {
          $match: {
            status: { $in: ["paid", "shipped", "delivered"] },
            createdAt: { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: "pending" }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("user", "name email")
        .select("status total createdAt items user")
        .lean<
          {
            _id: { toString(): string };
            status: string;
            total: number;
            createdAt: Date;
            items: { name: string; qty: number }[];
            user?: { name?: string };
          }[]
        >(),
      Product.find({ stock: { $lte: 5 }, isActive: true })
        .select("name stock")
        .sort({ stock: 1 })
        .limit(8)
        .lean<{ _id: { toString(): string }; name: string; stock: number }[]>(),
    ]);

    return NextResponse.json({
      totalRevenue: totalRevenueResult[0]?.total ?? 0,
      monthRevenue: monthRevenueResult[0]?.total ?? 0,
      todayOrders: todayOrdersCount,
      totalProducts: totalProductsCount,
      pendingOrders: pendingOrdersCount,
      recentOrders: recentOrders.map((order) => ({
        id: order._id.toString(),
        customer: order.user?.name ?? "Misafir",
        amount: order.total,
        status: order.status,
        date: new Date(order.createdAt).toLocaleDateString("tr-TR"),
        items: order.items.slice(0, 2).map((i) => `${i.name} x${i.qty}`).join(", "),
      })),
      lowStock: lowStockProducts.map((p) => ({ name: p.name, stock: p.stock })),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats." }, { status: 500 });
  }
}
