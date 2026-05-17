import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import Product from "@/models/Product";
import { connectDB } from "@/lib/db";
import { getGroqClient, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";
import { upsellRequestSchema } from "@/lib/validate";

export const runtime = "nodejs";

function extractJsonArray(raw: string): string[] {
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return Array.isArray(parsed) ? (parsed.filter((item) => typeof item === "string") as string[]) : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    const limited = await checkRateLimit(request, {
      key: "ai-upsell",
      limit: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validation = upsellRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid upsell payload." },
        { status: 400 }
      );
    }

    const cartItems = validation.data.cartItems;

    if (cartItems.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    if (!isGroqConfigured()) {
      return NextResponse.json({ suggestions: [] });
    }

    await connectDB();

    const cartProductIds = cartItems.map((item) => item.productId);

    const catalog = await Product.find({
      _id: { $nin: cartProductIds },
      isActive: true,
    })
      .select("_id name brand price category ratings")
      .sort({ sold: -1 })
      .limit(60)
      .lean<
        {
          _id: { toString(): string };
          name: string;
          brand: string;
          price: number;
          ratings?: { avg?: number };
        }[]
      >();

    if (catalog.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Sen bir e-ticaret upsell öneri asistanısın.
Kullanıcının sepetindeki ürünlerle iyi gidebilecek 3 ürünü katalogdan seç.
SADECE MongoDB _id string listesi döndür: ["id1","id2","id3"]`,
        },
        {
          role: "user",
          content: JSON.stringify({
            cart: cartItems.map((item) => ({ name: item.name, price: item.price })),
            catalog: catalog.map((p) => ({
              id: p._id.toString(),
              name: p.name,
              brand: p.brand,
              price: p.price,
              rating: p.ratings?.avg ?? 0,
            })),
          }),
        },
      ],
    });

    const suggestedIds = extractJsonArray(completion.choices[0]?.message?.content ?? "").slice(0, 3);
    const suggestions = await Product.find({ _id: { $in: suggestedIds }, isActive: true })
      .select("_id name slug price comparePrice brand images ratings")
      .lean();

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("AI upsell error:", error);
    return NextResponse.json({ error: "Failed to get upsell suggestions." }, { status: 500 });
  }
}
