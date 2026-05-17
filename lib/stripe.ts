import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripeServer() {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
  }

  stripeInstance = new Stripe(secretKey);

  return stripeInstance;
}
