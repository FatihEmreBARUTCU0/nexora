import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 })
      .lean<{ _id: { toString(): string }; name: string; slug: string }[]>();

    const productCounts = await Product.aggregate<{ _id: unknown; count: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(productCounts.map((item) => [String(item._id), item.count]));

    const result = categories.map((category) => ({
      _id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      productCount: countMap.get(category._id.toString()) ?? 0,
    }));

    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: "Failed to fetch categories." }, { status: 500 });
  }
}
