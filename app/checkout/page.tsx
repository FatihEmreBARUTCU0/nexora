"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/context/CartContext";

const stepTitles = ["Teslimat", "Sipariş Özeti", "Ödeme"];

const isDemoCheckout = process.env.NEXT_PUBLIC_NEXORA_DEMO_MODE === "true";

type ShippingAddress = {
  name: string;
  surname: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
};

type StripePaymentFormProps = {
  clientSecret: string;
  fullName: string;
  onSuccess: () => void;
};

function StripePaymentForm({ clientSecret, fullName, onSuccess }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!stripe || !elements) return;
    setIsProcessing(true);
    setPaymentError(null);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: fullName,
            },
          },
        },
      });

      if (result.error) {
        setPaymentError(result.error.message ?? "Ödeme sırasında bir hata oluştu.");
        return;
      }

      if (result.paymentIntent?.status === "succeeded") {
        onSuccess();
      } else {
        setPaymentError("Ödeme tamamlanamadı. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-4">
        <PaymentElement />
      </div>
      {paymentError ? <p className="mt-3 text-sm text-red-400">{paymentError}</p> : null}
      <button
        type="button"
        onClick={() => void handlePayment()}
        disabled={isProcessing || !stripe || !elements}
        className="mt-4 w-full rounded-xl bg-[#6366f1] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8] disabled:opacity-70"
      >
        {isProcessing ? "Ödeme işleniyor..." : "Kart ile Öde"}
      </button>
      <p className="mt-3 text-xs text-zinc-500">
        Ödeme Stripe üzerinden güvenli şekilde işlenir.
      </p>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { data: session, status } = useSession();
  const { items } = useCart();
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    surname: "",
    phone: "",
    city: "",
    district: "",
    fullAddress: "",
  });

  const orderItems = items.map((item) => ({
    id: item.productId,
    name: item.name,
    qty: item.quantity,
    price: item.price,
  }));

  const subtotal = useMemo(
    () => orderItems.reduce((total, item) => total + item.price * item.qty, 0),
    [orderItems]
  );
  const shipping = subtotal >= 500 ? 0 : 49.9;
  const total = subtotal + shipping;
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [router, status]);

  const validateStep = (currentStep: number) => {
    const nextErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!shippingAddress.name.trim()) nextErrors.name = "Ad zorunludur.";
      if (!shippingAddress.surname.trim()) nextErrors.surname = "Soyad zorunludur.";
      if (!shippingAddress.phone.trim()) nextErrors.phone = "Telefon zorunludur.";
      if (!shippingAddress.city.trim()) nextErrors.city = "İl zorunludur.";
      if (!shippingAddress.district.trim()) nextErrors.district = "İlçe zorunludur.";
      if (!shippingAddress.fullAddress.trim()) nextErrors.fullAddress = "Adres zorunludur.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const createPaymentIntent = async () => {
    if (!session?.user?.id) return;
    if (!validateStep(0)) return;
    setIsCreatingIntent(true);

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartItems: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: {
            name: `${shippingAddress.name} ${shippingAddress.surname}`.trim(),
            phone: shippingAddress.phone,
            city: shippingAddress.city,
            district: shippingAddress.district,
            fullAddress: shippingAddress.fullAddress,
          },
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        orderId?: string;
        developmentBypass?: boolean;
        clientSecret?: string;
        publishableKey?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Payment initialization failed.");
      }
      if (data.orderId) {
        setOrderId(data.orderId);
      }

      if (data.developmentBypass && data.success) {
        router.push(
          `/checkout/success?orderId=${encodeURIComponent(data.orderId ?? "")}&clearCart=true`
        );
        return;
      }
      if (!data.clientSecret) {
        throw new Error("Stripe client secret is missing.");
      }
      if (!data.publishableKey) {
        throw new Error("Stripe publishable key is missing.");
      }

      setClientSecret(data.clientSecret);
      setPublishableKey(data.publishableKey);
    } catch (error) {
      console.error(error);
      toast.error("Ödeme başlatılamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (status === "loading") {
    return <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 text-zinc-400 md:px-10">Yükleniyor...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 flex items-center gap-3">
        {stepTitles.map((title, index) => (
          <div key={title} className="flex items-center gap-3">
            <div
              className={`rounded-full border px-3 py-1 text-xs tracking-[0.14em] ${
                index <= step
                  ? "border-[#6366f1] bg-[#6366f11f] text-[#c7d2fe]"
                  : "border-[#2a2a2a] text-zinc-500"
              }`}
            >
              {title}
            </div>
            {index < stepTitles.length - 1 && <span className="text-zinc-600">→</span>}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-7 md:p-8">
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-semibold text-white">Teslimat Bilgileri</h1>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  className={`rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm ${
                    errors.name ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="Ad"
                  value={shippingAddress.name}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                {errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
                <input
                  className={`rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm ${
                    errors.surname ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="Soyad"
                  value={shippingAddress.surname}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, surname: event.target.value }))
                  }
                />
                {errors.surname ? <p className="text-xs text-red-400">{errors.surname}</p> : null}
                <input
                  className={`rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm md:col-span-2 ${
                    errors.phone ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="Telefon"
                  value={shippingAddress.phone}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                {errors.phone ? <p className="text-xs text-red-400 md:col-span-2">{errors.phone}</p> : null}
                <input
                  className={`rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm ${
                    errors.city ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="İl"
                  value={shippingAddress.city}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, city: event.target.value }))
                  }
                />
                {errors.city ? <p className="text-xs text-red-400">{errors.city}</p> : null}
                <input
                  className={`rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm ${
                    errors.district ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="İlçe"
                  value={shippingAddress.district}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, district: event.target.value }))
                  }
                />
                {errors.district ? <p className="text-xs text-red-400">{errors.district}</p> : null}
                <textarea
                  className={`min-h-[120px] rounded-xl border bg-[#0d0d0d] px-4 py-3 text-sm md:col-span-2 ${
                    errors.fullAddress ? "border-red-500" : "border-[#2a2a2a]"
                  }`}
                  placeholder="Açık adres"
                  value={shippingAddress.fullAddress}
                  onChange={(event) =>
                    setShippingAddress((prev) => ({ ...prev, fullAddress: event.target.value }))
                  }
                />
                {errors.fullAddress ? (
                  <p className="text-xs text-red-400 md:col-span-2">{errors.fullAddress}</p>
                ) : null}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold text-white">Sipariş Özeti</h1>
              <div className="mt-6 space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <p className="text-zinc-300">
                      {item.name} <span className="text-zinc-500">x{item.qty}</span>
                    </p>
                    <p className="text-white">{item.price.toLocaleString("tr-TR")} TL</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-4 text-sm text-zinc-300">
                <p className="mb-2 text-zinc-400">Teslimat Adresi</p>
                <p>
                  {shippingAddress.name} {shippingAddress.surname} • {shippingAddress.phone}
                </p>
                <p>
                  {shippingAddress.city} / {shippingAddress.district}
                </p>
                <p>{shippingAddress.fullAddress}</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-semibold text-white">Ödeme</h1>
              {isDemoCheckout ? (
                <>
                  <div className="mt-6 rounded-xl border border-[#6366f144] bg-[#6366f10f] p-4 text-sm text-zinc-300">
                    <p className="font-medium text-[#c7d2fe]">Demo ödeme</p>
                    <p className="mt-2">
                      Kart bilgisi gerekmez. Siparişiniz demo modunda anında onaylanır.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void createPaymentIntent()}
                    disabled={isCreatingIntent}
                    className="mt-8 w-full rounded-xl bg-[#6366f1] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8] disabled:opacity-70"
                  >
                    {isCreatingIntent ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" /> Sipariş oluşturuluyor...
                      </span>
                    ) : (
                      "Demo Siparişi Tamamla"
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="mt-6 rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] p-4 text-sm text-zinc-300">
                    <p className="font-medium text-zinc-200">Stripe Test Kartı</p>
                    <p className="mt-2">Kart No: 4242 4242 4242 4242</p>
                    <p>CVC: herhangi 3 hane</p>
                    <p>SKT: gelecekte bir tarih</p>
                  </div>
                  {!clientSecret ? (
                    <button
                      type="button"
                      onClick={() => void createPaymentIntent()}
                      disabled={isCreatingIntent}
                      className="mt-8 w-full rounded-xl bg-[#6366f1] px-5 py-4 text-sm font-medium text-white transition hover:bg-[#5458e8]"
                    >
                      {isCreatingIntent ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> Ödeme oturumu oluşturuluyor...
                        </span>
                      ) : (
                        "Ödemeyi Başlat"
                      )}
                    </button>
                  ) : (
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                      <StripePaymentForm
                        clientSecret={clientSecret}
                        fullName={`${shippingAddress.name} ${shippingAddress.surname}`.trim()}
                        onSuccess={() =>
                          router.push(
                            `/checkout/success?orderId=${encodeURIComponent(orderId ?? "")}&clearCart=true`
                          )
                        }
                      />
                    </Elements>
                  )}
                </>
              )}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((prev) => Math.max(prev - 1, 0))}
              className="rounded-full border border-[#2a2a2a] px-6 py-3 text-sm text-zinc-200 transition hover:border-[#3a3a3a]"
            >
              Geri
            </button>
            {step < 2 && (
              <button
                type="button"
                onClick={() => {
                  const canProceed = validateStep(step);
                  if (!canProceed) return;
                  setStep((prev) => Math.min(prev + 1, 2));
                }}
                className="rounded-full bg-[#6366f1] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#5458e8]"
              >
                İleri
              </button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-[#1f1f1f] bg-[#111111] p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-medium text-white">Sipariş Özeti</h2>
          <div className="mt-5 space-y-4 text-sm">
            {orderItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-zinc-400">
                <span>{item.name}</span>
                <span>{item.price.toLocaleString("tr-TR")} TL</span>
              </div>
            ))}
            <div className="h-px bg-[#1f1f1f]" />
            <div className="flex items-center justify-between text-zinc-400">
              <span>Ara Toplam</span>
              <span>{subtotal.toLocaleString("tr-TR")} TL</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>Kargo</span>
              {shipping === 0 ? (
                <span className="text-[#86efac]">Ücretsiz</span>
              ) : (
                <span>{shipping.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} TL</span>
              )}
            </div>
            <div className="flex items-center justify-between text-base font-medium text-white">
              <span>Toplam</span>
              <span>{total.toLocaleString("tr-TR")} TL</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
