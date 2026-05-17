import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { connectDB } from "@/lib/db";
import { getGroqClient, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

function extractJsonArray(raw: string): string[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    return [];
  }
  const parsed = JSON.parse(raw.slice(start, end + 1));
  return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === "string") as string[]) : [];
}

export async function POST(request: NextRequest) {
  try {
    const limited = await checkRateLimit(request, {
      key: "ai-recommend",
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) return authResult.response;
    const { session } = authResult;

    if (!isGroqConfigured()) {
      return NextResponse.json({ recommendations: [] });
    }

    await connectDB();

    const recentOrders = await Order.find({
      user: session.user.id,
      status: { $in: ["paid", "shipped", "delivered"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("items")
      .lean<{ items: { product: { toString(): string }; name: string; qty: number }[] }[]>();

    const purchasedProductIds = Array.from(
      new Set(recentOrders.flatMap((order) => order.items.map((item) => item.product.toString())))
    );

    const catalog = await Product.find({
      _id: { $nin: purchasedProductIds },
      isActive: true,
    })
      .select("_id name slug brand price category ratings images")
      .limit(80)
      .lean<
        {
          _id: { toString(): string };
          name: string;
          brand: string;
          price: number;
          category?: string;
          ratings?: { avg?: number };
        }[]
      >();

    if (catalog.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Sen kişiselleştirilmiş ürün öneri asistanısın.
Kullanıcının son siparişlerine bakarak katalogdan 4 ürün öner.
Sadece JSON string array döndür, örnek: ["id1","id2","id3","id4"]`,
        },
        {
          role: "user",
          content: JSON.stringify({
            recentOrders: recentOrders.map((order) =>
              order.items.map((item) => ({
                productId: item.product.toString(),
                name: item.name,
                qty: item.qty,
              }))
            ),
            catalog: catalog.map((p) => ({
              id: p._id.toString(),
              name: p.name,
              brand: p.brand,
              price: p.price,
              category: p.category,
              rating: p.ratings?.avg ?? 0,
            })),
          }),
        },
      ],
    });

    const suggestedIds = extractJsonArray(completion.choices[0]?.message?.content ?? "").slice(0, 4);
    const recommendations = await Product.find({ _id: { $in: suggestedIds } })
      .select("_id name slug brand price images")
      .lean();

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("AI recommend error:", error);
    return NextResponse.json({ error: "Failed to get AI recommendations." }, { status: 500 });
  }
}
