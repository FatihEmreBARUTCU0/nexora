/**
 * Demo deployment (e.g. Vercel showcase) — no real card charges.
 * Set NEXORA_DEMO_MODE=true on the server.
 * Set NEXT_PUBLIC_NEXORA_DEMO_MODE=true for checkout UI (same value).
 */
export function isDemoPaymentBypassEnabled(): boolean {
  if (process.env.NEXORA_DEMO_MODE === "true") {
    return true;
  }

  return (
    process.env.NODE_ENV === "development" &&
    process.env.ALLOW_DEV_PAYMENT_BYPASS === "true"
  );
}

export function isPublicDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_NEXORA_DEMO_MODE === "true";
}
