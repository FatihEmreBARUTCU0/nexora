export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_NEXORA_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <p
      role="status"
      className="border-b border-[#6366f144] bg-[#6366f114] px-4 py-2 text-center text-xs text-[#c7d2fe]"
    >
      Demo ortamı — gerçek ödeme alınmaz. Siparişler simüle edilir.
    </p>
  );
}
