"use client";

type ProductsErrorProps = {
  error: Error;
  reset: () => void;
};

export default function ProductsError({ error, reset }: ProductsErrorProps) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-6 py-16 md:px-10">
      <div className="max-w-lg rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 text-center">
        <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-3 text-sm text-zinc-400">{error.message}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-[#b44dff] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9f33ee]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
