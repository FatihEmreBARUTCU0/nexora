"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function AdminSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/" })}
      className="absolute bottom-5 left-5 right-5 inline-flex items-center justify-center gap-2 rounded-xl border border-[#2a2a2a] px-3 py-2 text-sm text-zinc-300 transition hover:border-[#3a3a3a] hover:text-white"
    >
      <LogOut size={16} />
      Çıkış
    </button>
  );
}
