"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [router, session, status]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });

      const data = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(data.error ?? "Profil güncellenemedi.");
        return;
      }

      setMessage(data.message ?? "Profil başarıyla güncellendi.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 text-zinc-400 md:px-10">Profil yükleniyor...</div>;
  }

  if (!session?.user) return null;

  return (
    <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-10 flex items-center gap-4">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">Profilim</h1>
        <span className="h-px flex-1 bg-[#1f1f1f]" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-7">
          <h2 className="text-xl font-medium text-white">Hesap Bilgileri</h2>
          <div className="mt-5 space-y-3 text-sm">
            <p className="text-zinc-300">
              <span className="text-zinc-500">Ad:</span> {session.user.name}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">E-posta:</span> {session.user.email}
            </p>
            <p className="text-zinc-300">
              <span className="text-zinc-500">Rol:</span> {session.user.role}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-[#1f1f1f] bg-[#111111] p-7">
          <h2 className="text-xl font-medium text-white">Şifre Değiştir</h2>
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ad Soyad"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
            />
            <input
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              type="password"
              placeholder="Mevcut şifre"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
            />
            <input
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              type="password"
              placeholder="Yeni şifre"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
            />
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              placeholder="Yeni şifre tekrar"
              className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
            />

            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#b44dff] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#9f33ee] disabled:opacity-70"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
