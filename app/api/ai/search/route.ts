import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { connectDB } from "@/lib/db";
import { getGroqClient, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";
import { aiSearchRequestSchema, escapeRegex } from "@/lib/validate";

export const runtime = "nodejs";

type SearchFilter = {
  keywords?: string;
  maxPrice?: number | null;
  minPrice?: number | null;
  category?: string;
  brand?: string;
};

const ALLOWED_CATEGORIES = [
  "Elektronik",
  "Giyim",
  "Ev ve Yaşam",
  "Spor",
  "Aksesuar",
] as const;

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^\d.,-]/g, "").replace(",", ".");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function extractJsonObject(raw: string): SearchFilter {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Invalid JSON response from model.");
  }
  return JSON.parse(raw.slice(start, end + 1)) as SearchFilter;
}

function logAiSearchError(context: string, error: unknown) {
  const groqKeySet = Boolean(process.env.GROQ_API_KEY?.trim());
  const base = { context, groqKeySet };

  if (error && typeof error === "object" && "status" in error) {
    const apiError = error as { status?: number; message?: string; error?: unknown };
    console.error("AI search error:", {
      ...base,
      status: apiError.status,
      message: apiError.message,
      details: apiError.error,
    });
    return;
  }

  console.error("AI search error:", {
    ...base,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: "Groq API anahtarı yapılandırılmamış (GROQ_API_KEY)." },
        { status: 503 }
      );
    }

    const limited = await checkRateLimit(request, {
      key: "ai-search",
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const body = await request.json();
    const validation = aiSearchRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid search query." },
        { status: 400 }
      );
    }

    await connectDB();
    const query = validation.data.query.trim();

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content: `Kullanıcının doğal dilde yazdığı ürün aramasını aşağıdaki JSON formatına çevir.
SADECE JSON döndür, başka hiçbir şey yazma.
{
"keywords": "ürün adı veya tipi",
"minPrice": null veya sayı,
"maxPrice": null veya sayı,
"category": null veya "Elektronik|Giyim|Ev ve Yaşam|Spor|Aksesuar",
"brand": null veya marka adı
}
Örnek:
"500 TL altı matara" -> {"keywords":"matara","minPrice":null,"maxPrice":500,"category":"Spor","brand":null}`,
        },
        { role: "user", content: query },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "{}";
    const parsedRaw = extractJsonObject(rawContent);
    const parsed: SearchFilter = {
      keywords: parsedRaw.keywords?.trim() || undefined,
      brand: parsedRaw.brand?.trim() || undefined,
      category: ALLOWED_CATEGORIES.includes(parsedRaw.category as (typeof ALLOWED_CATEGORIES)[number])
        ? parsedRaw.category
        : undefined,
      minPrice: toNumberOrNull(parsedRaw.minPrice),
      maxPrice: toNumberOrNull(parsedRaw.maxPrice),
    };

    const filter: Record<string, unknown> = {};
    filter.isActive = true;

    if (parsed.brand) {
      filter.brand = { $regex: escapeRegex(parsed.brand), $options: "i" };
    }

    if (parsed.minPrice != null || parsed.maxPrice != null) {
      filter.price = {};
      if (parsed.minPrice != null) {
        (filter.price as Record<string, number>).$gte = parsed.minPrice;
      }
      if (parsed.maxPrice != null) {
        (filter.price as Record<string, number>).$lte = parsed.maxPrice;
      }
    }

    if (parsed.category) {
      const categoryDoc = await Category.findOne({
        name: parsed.category,
      })
        .select("_id")
        .lean<{ _id: { toString(): string } } | null>();

      if (categoryDoc) {
        filter.category = categoryDoc._id.toString();
      }
    }

    if (parsed.keywords) {
      const safeKeywords = escapeRegex(parsed.keywords);
      filter.$or = [
        { name: { $regex: safeKeywords, $options: "i" } },
        { description: { $regex: safeKeywords, $options: "i" } },
      ];
    }

    let sort: Record<string, 1 | -1> = { sold: -1, createdAt: -1 };
    if (parsed.minPrice != null) {
      sort = { price: -1 };
    } else if (parsed.maxPrice != null) {
      sort = { price: 1 };
    }

    const products = await Product.find(filter).sort(sort).limit(24).lean();

    return NextResponse.json({ filters: parsed, products });
  } catch (error) {
    logAiSearchError("search", error);

    const message =
      error instanceof Error ? error.message : "AI araması işlenirken bir hata oluştu.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
