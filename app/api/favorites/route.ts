import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { favoriteAddSchema } from "@/lib/validate";
import Product from "@/models/Product";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("favorites")
      .lean<{ favorites?: { productId: string; name: string; slug: string; image: string; price: number }[] } | null>();

    return NextResponse.json({ favorites: user?.favorites ?? [] });
  } catch (error) {
    console.error("Favorites GET error:", error);
    return NextResponse.json({ error: "Failed to fetch favorites." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    const body = await request.json();
    const validation = favoriteAddSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid favorite payload." },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.findOne({
      _id: validation.data.productId,
      isActive: true,
    })
      .select("name slug price images")
      .lean<{
        name: string;
        slug: string;
        price: number;
        images?: { url: string }[];
      } | null>();

    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    await User.findByIdAndUpdate(session.user.id, {
      $addToSet: {
        favorites: {
          productId: validation.data.productId,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url ?? "",
          price: product.price,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorites POST error:", error);
    return NextResponse.json({ error: "Failed to add favorite." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    const productId = request.nextUrl.searchParams.get("productId");
    if (!productId) {
      return NextResponse.json({ error: "productId is required." }, { status: 400 });
    }

    await connectDB();

    await User.findByIdAndUpdate(session.user.id, {
      $pull: { favorites: { productId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Favorites DELETE error:", error);
    return NextResponse.json({ error: "Failed to remove favorite." }, { status: 500 });
  }
}
