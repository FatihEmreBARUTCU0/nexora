import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { connectDB } from "@/lib/db";
import { getStripeServer } from "@/lib/stripe";
import { confirmSale, releaseStock } from "@/lib/stock";
import Order from "@/models/Order";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeServer();
    const signature = request.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing Stripe webhook configuration." }, { status: 400 });
    }

    const payload = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error("Stripe webhook signature error:", error);
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
    }

    await connectDB();

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await Order.findOne({ paymentId: paymentIntent.id });

      if (order && order.status === "pending") {
        order.status = "paid";
        await order.save();

        for (const item of order.items) {
          await confirmSale(item.product.toString(), item.qty);
        }
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const order = await Order.findOne({
        paymentId: paymentIntent.id,
        status: "pending",
      });

      if (order) {
        for (const item of order.items) {
          await releaseStock(item.product.toString(), item.qty);
        }
        order.status = "failed";
        await order.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe payment callback error:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
