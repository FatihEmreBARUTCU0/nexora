import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { getGroqClient, GROQ_MODEL, isGroqConfigured } from "@/lib/groq";
import { checkRateLimit } from "@/lib/rateLimit";
import { chatRequestSchema } from "@/lib/validate";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }
    const { session } = authResult;

    const limited = await checkRateLimit(request, {
      key: "ai-chat",
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    if (!isGroqConfigured()) {
      return NextResponse.json(
        { error: "AI destek şu an yapılandırılmamış (GROQ_API_KEY)." },
        { status: 503 }
      );
    }

    await connectDB();
    const activeOrders = await Order.find({
      user: session.user.id,
      status: { $in: ["pending", "paid", "shipped", "delivered"] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("_id status total items createdAt")
      .lean<
        {
          _id: { toString(): string };
          status: string;
          total: number;
          createdAt: string;
          items: { name: string; qty: number }[];
        }[]
      >();

    const statusLabels: Record<string, string> = {
      pending: "Beklemede",
      paid: "Ödendi",
      shipped: "Kargoda",
      delivered: "Teslim edildi",
      cancelled: "İptal",
      failed: "Başarısız",
    };

    const activeOrdersContext =
      activeOrders.length > 0
        ? JSON.stringify(
            activeOrders.map((order) => ({
              orderNo: order._id.toString().slice(-6).toUpperCase(),
              status: statusLabels[order.status] ?? order.status,
              total: order.total,
              createdAt: order.createdAt,
              items: order.items.map((item) => `${item.name} x${item.qty}`),
            }))
          )
        : "Kullanıcının siparişi yok.";

    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid chat payload." },
        { status: 400 }
      );
    }

    const messages = validation.data.messages.filter((message) => message.role === "user");

    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one user message is required." }, { status: 400 });
    }

    const stream = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      stream: true,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: `Sen Nexora'nın müşteri destek asistanısın.
- 14 gün iade garantisi var.
- 500 TL üzeri ücretsiz kargo var.
- Kısa, net ve nazik cevap ver.
- Bilmediğin konuda uydurma bilgi verme.
- Kargo takip numarası veya paket konumu yok; yalnızca sipariş durumunu (Beklemede, Ödendi, Kargoda, Teslim edildi) kullan.
- Sipariş numarası orderNo alanıdır; kullanıcıya Türkçe durum adını söyle.
Siparişler (JSON): ${activeOrdersContext}`,
        },
        ...messages,
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content ?? "";
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        }
        controller.close();
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Failed to stream AI chat response." }, { status: 500 });
  }
}
