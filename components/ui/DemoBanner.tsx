export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_NEXORA_DEMO_MODE !== "true") {
    return null;
  }

  return (
    <p
      role="status"
      className="border-b border-[#ff6a0044] bg-[#ff6a0014] px-4 py-2 text-center text-xs text-[#ffb380]"
    >
      Demo ortamı — gerçek ödeme alınmaz. Siparişler simüle edilir.
    </p>
  );
}
