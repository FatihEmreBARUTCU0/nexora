export default function ProductsLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 h-10 w-64 animate-pulse rounded bg-[#1a1a1a]" />
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <div className="h-[520px] animate-pulse rounded-2xl border border-[#1f1f1f] bg-[#111111]" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[390px] animate-pulse rounded-2xl border border-[#1f1f1f] bg-[#111111]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
