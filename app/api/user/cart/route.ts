import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { cartUpdateSchema } from "@/lib/validate";
import Product from "@/models/Product";
import User from "@/models/User";

export const runtime = "nodejs";

type CartItemInput = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  slug: string;
  selectedColor?: string;
  selectedSize?: string;
};

async function syncCartWithCatalog(items: CartItemInput[]): Promise<CartItemInput[]> {
  const synced: CartItemInput[] = [];

  for (const item of items) {
    const product = await Product.findOne({ _id: item.productId, isActive: true })
      .select("name slug price images")
      .lean<{
        name: string;
        slug: string;
        price: number;
        images?: { url: string }[];
      } | null>();

    if (!product) continue;

    synced.push({
      ...item,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0]?.url ?? item.image,
    });
  }

  return synced;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("cart")
      .lean<{ cart?: unknown[] } | null>();

    return NextResponse.json({ cart: user?.cart ?? [] });
  } catch (error) {
    console.error("Cart GET error:", error);
    return NextResponse.json({ error: "Failed to fetch cart." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    const body = await request.json();
    const validation = cartUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid cart payload." },
        { status: 400 }
      );
    }

    await connectDB();

    const syncedItems = await syncCartWithCatalog(validation.data.items);

    await User.findByIdAndUpdate(
      session.user.id,
      { $set: { cart: syncedItems } },
      { runValidators: true }
    );

    return NextResponse.json({ success: true, cart: syncedItems });
  } catch (error) {
    console.error("Cart PUT error:", error);
    return NextResponse.json({ error: "Failed to save cart." }, { status: 500 });
  }
}
