import { Suspense } from "react";
import { CheckoutSuccessContent } from "./CheckoutSuccessContent";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-2xl items-center justify-center px-6 py-16 text-zinc-400">
          Yükleniyor...
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
