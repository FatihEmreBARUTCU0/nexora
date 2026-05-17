export function Footer() {
  return (
    <footer className="border-t border-[#1f1f1f] bg-[#0a0a0a]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-12 text-sm text-zinc-400 md:px-10">
        <p className="text-base font-medium text-zinc-200">Nexora</p>
        <p>Premium dark e-ticaret deneyimi icin tasarlandi.</p>
        <p className="text-zinc-500">
          © {new Date().getFullYear()} Nexora. Tum haklari saklidir.
        </p>
      </div>
    </footer>
  );
}
