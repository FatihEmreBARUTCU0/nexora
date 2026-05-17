import { NextRequest, NextResponse } from "next/server";
import { hasAuthError, requireAdmin, requireAuth } from "@/lib/apiAuth";
import { connectDB } from "@/lib/db";
import { confirmSale, releaseStock, reserveStock, reverseSale } from "@/lib/stock";
import { orderSchema } from "@/lib/validate";
import Order from "@/models/Order";

type OrderCreatePayload = {
  items: { product: string; qty: number }[];
  shippingAddress: {
    name: string;
    phone: string;
    city: string;
    district: string;
    fullAddress: string;
  };
  paymentMethod: string;
  shipping?: number;
  directCreate?: boolean;
};

type ReservedLine = {
  productId: string;
  qty: number;
  soldConfirmed: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const all = request.nextUrl.searchParams.get("all") === "true";
    const authResult = all ? await requireAdmin(request) : await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }
    const { session } = authResult;

    await connectDB();

    const query = all ? {} : { user: session.user.id };
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .lean();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Orders GET error:", error);
    return NextResponse.json({ error: "Failed to fetch orders." }, { status: 500 });
  }
}

async function rollbackReserved(reserved: ReservedLine[]) {
  for (const line of reserved) {
    if (line.soldConfirmed) {
      await reverseSale(line.productId, line.qty);
    } else {
      await releaseStock(line.productId, line.qty);
    }
  }
}

export async function POST(request: NextRequest) {
  const reserved: ReservedLine[] = [];

  try {
    const authResult = await requireAuth(request);
    if (hasAuthError(authResult)) {
      return authResult.response;
    }
    const { session } = authResult;

    const body = (await request.json()) as OrderCreatePayload;
    const validation = orderSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid order payload." },
        { status: 400 }
      );
    }

    const isAdmin = session.user.role === "admin";
    const directCreateRequested = body.directCreate === true;

    if (!isAdmin || !directCreateRequested) {
      const paymentResponse = await fetch(`${request.nextUrl.origin}/api/payment/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({
          cartItems: body.items.map((item) => ({
            productId: item.product,
            quantity: item.qty,
          })),
          shippingAddress: body.shippingAddress,
        }),
      });

      const paymentData = await paymentResponse.json();
      return NextResponse.json(paymentData, { status: paymentResponse.status });
    }

    await connectDB();

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of body.items) {
      const product = await reserveStock(item.product, item.qty);

      if (!product) {
        await rollbackReserved(reserved);
        return NextResponse.json(
          { error: "One or more products are unavailable or out of stock." },
          { status: 400 }
        );
      }

      reserved.push({
        productId: product._id.toString(),
        qty: item.qty,
        soldConfirmed: false,
      });

      subtotal += product.price * item.qty;
      normalizedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        qty: item.qty,
        image: product.images?.[0]?.url ?? "",
      });
    }

    for (const line of reserved) {
      await confirmSale(line.productId, line.qty);
      line.soldConfirmed = true;
    }

    const shipping = body.shipping ?? 0;
    const total = subtotal + shipping;

    const createdOrder = await Order.create({
      user: session.user.id,
      items: normalizedItems,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      status: "pending",
      subtotal,
      shipping,
      total,
    });

    return NextResponse.json({ order: createdOrder }, { status: 201 });
  } catch (error) {
    await rollbackReserved(reserved);
    console.error("Orders POST error:", error);
    return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
  }
}
