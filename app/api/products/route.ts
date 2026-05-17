import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { escapeRegex, productSchema } from "@/lib/validate";
import Category from "@/models/Category";
import Product from "@/models/Product";

type ProductQuery = {
  slug?: string;
  category?: string;
  brand?: string;
  $or?: Array<Record<string, { $regex: string; $options: string }>>;
  price?: { $gte?: number; $lte?: number };
};

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const adminView = searchParams.get("admin") === "true";
    let includeInactive = false;

    if (adminView) {
      const authResult = await requireAdmin(request);
      if (hasAuthError(authResult)) {
        return authResult.response;
      }
      includeInactive = true;
    }
    const slug = searchParams.get("slug");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const search = searchParams.get("search");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "12") || 12));

    const filter: ProductQuery & { isActive?: boolean } = includeInactive ? {} : { isActive: true };

    if (slug) filter.slug = slug;
    if (category) {
      const categoryDoc = await Category.findOne({
        $or: [{ slug: category }, { name: { $regex: escapeRegex(category), $options: "i" } }],
      })
        .select("_id")
        .lean<{ _id: { toString(): string } } | null>();

      if (categoryDoc) {
        filter.category = categoryDoc._id.toString();
      } else {
        filter.category = category;
      }
    }
    if (brand) filter.brand = brand;
    if (search?.trim()) {
      const normalizedSearch = escapeRegex(search.trim());
      filter.$or = [
        { name: { $regex: normalizedSearch, $options: "i" } },
        { description: { $regex: normalizedSearch, $options: "i" } },
        { brand: { $regex: normalizedSearch, $options: "i" } },
      ];
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice && !Number.isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice && !Number.isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1 },
      price_asc: { price: 1 },
      priceDesc: { price: -1 },
      price_desc: { price: -1 },
      ratingDesc: { "ratings.avg": -1 },
      rating_desc: { "ratings.avg": -1 },
      sold: { sold: -1 },
    };

    const skip = (page - 1) * limit;
    const sortBy = sortMap[sort] ?? sortMap.newest;

    if (slug) {
      const slugFilter = includeInactive ? { slug } : { slug, isActive: true };
      const product = await Product.findOne(slugFilter).lean();
      return NextResponse.json({
        products: product ? [product] : [],
        pagination: {
          total: product ? 1 : 0,
          page: 1,
          limit: 1,
          totalPages: product ? 1 : 0,
        },
      });
    }

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortBy).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: "Failed to fetch products." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    await connectDB();

    const body = await request.json();
    const validation = productSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid product payload." },
        { status: 400 }
      );
    }

    const createdProduct = await Product.create(validation.data);

    return NextResponse.json({ product: createdProduct }, { status: 201 });
  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 });
  }
}
