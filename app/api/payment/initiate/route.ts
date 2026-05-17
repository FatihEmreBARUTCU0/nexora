import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isDemoPaymentBypassEnabled } from "@/lib/demoMode";
import { connectDB } from "@/lib/db";
import { expireStalePendingOrders } from "@/lib/pendingOrders";
import { checkRateLimit } from "@/lib/rateLimit";
import { getStripeServer } from "@/lib/stripe";
import { confirmSale, releaseStock, reserveStock } from "@/lib/stock";
import { paymentInitiateSchema } from "@/lib/validate";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const reserved: { productId: string; qty: number }[] = [];

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const limited = await checkRateLimit(request, {
      key: "payment-initiate",
      limit: 5,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const userId = session.user.id;
    const body = await request.json();
    const validation = paymentInitiateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid payment payload." },
        { status: 400 }
      );
    }

    const { cartItems, shippingAddress } = validation.data;

    await connectDB();
    await expireStalePendingOrders();

    const normalizedItems = [];
    let subtotal = 0;

    for (const item of cartItems) {
      const product = await reserveStock(item.productId, item.quantity);

      if (!product) {
        for (const r of reserved) {
          await releaseStock(r.productId, r.qty);
        }
        return NextResponse.json(
          { error: "One or more products are unavailable or out of stock." },
          { status: 400 }
        );
      }

      reserved.push({ productId: product._id.toString(), qty: item.quantity });

      const lineTotal = product.price * item.quantity;
      subtotal += lineTotal;

      normalizedItems.push({
        product: product._id.toString(),
        name: product.name,
        price: product.price,
        qty: item.quantity,
        image: product.images?.[0]?.url ?? "",
      });
    }

    const shipping = subtotal >= 500 ? 0 : 49.9;
    const total = subtotal + shipping;

    if (isDemoPaymentBypassEnabled()) {
      for (const item of normalizedItems) {
        await confirmSale(item.product, item.qty);
      }

      const order = await Order.create({
        user: userId,
        items: normalizedItems,
        shippingAddress,
        paymentMethod: "demo",
        paymentId: `demo-${Date.now()}`,
        status: "paid",
        subtotal,
        shipping,
        total,
      });

      return NextResponse.json({
        success: true,
        orderId: order._id.toString(),
        demoBypass: true,
        developmentBypass: true,
      });
    }

    const stripe = getStripeServer();
    const amountInKurus = Math.round(total * 100);

    const order = await Order.create({
      user: userId,
      items: normalizedItems,
      shippingAddress,
      paymentMethod: "stripe",
      paymentId: "pending",
      status: "pending",
      subtotal,
      shipping,
      total,
    });

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInKurus,
        currency: "try",
        automatic_payment_methods: { enabled: true },
        metadata: {
          orderId: order._id.toString(),
        },
      });
    } catch (stripeError) {
      await Order.findByIdAndDelete(order._id);
      for (const r of reserved) {
        await releaseStock(r.productId, r.qty);
      }
      throw stripeError;
    }

    order.paymentId = paymentIntent.id;
    await order.save();

    return NextResponse.json({
      orderId: order._id.toString(),
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
    });
  } catch (error) {
    for (const r of reserved) {
      await releaseStock(r.productId, r.qty);
    }
    console.error("Payment initiate error:", error);
    return NextResponse.json({ error: "Failed to initiate payment." }, { status: 500 });
  }
}
