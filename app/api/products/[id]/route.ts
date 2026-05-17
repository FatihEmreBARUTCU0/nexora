import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { productUpdateSchema } from "@/lib/validate";
import Product from "@/models/Product";

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: ProductRouteContext) {
  try {
    await connectDB();
    const { id } = await context.params;

    const product = await Product.findOne({ _id: id, isActive: true }).lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product GET by id error:", error);
    return NextResponse.json({ error: "Failed to fetch product." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: ProductRouteContext) {
  try {
    const authResult = await requireAdmin(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    await connectDB();
    const { id } = await context.params;
    const body = await request.json();

    const validation = productUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid product payload." },
        { status: 400 }
      );
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: validation.data },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedProduct) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (error) {
    console.error("Product PUT by id error:", error);
    return NextResponse.json({ error: "Failed to update product." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: ProductRouteContext) {
  try {
    const authResult = await requireAdmin(_request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    await connectDB();
    const { id } = await context.params;

    const deletedProduct = await Product.findByIdAndDelete(id).lean();

    if (!deletedProduct) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Product DELETE by id error:", error);
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 });
  }
}
