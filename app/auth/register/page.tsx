"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const registerSchema = z
  .object({
    name: z.string().min(2, "Full name is required."),
    email: z.string().email("Please enter a valid email."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password confirmation is required."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setErrorMessage(null);
    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      });

      if (!registerResponse.ok) {
        const errorData = (await registerResponse.json()) as { error?: string };
        setErrorMessage(errorData.error ?? "Kayıt işlemi başarısız.");
        return;
      }

      router.push("/auth/login");
      router.refresh();
    } catch {
      setErrorMessage("Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-7xl items-center justify-center px-6 py-16 md:px-10">
      <section className="w-full max-w-md rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 md:p-10">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Kayıt Ol</h1>
        <p className="mt-2 text-sm text-zinc-400">Nexora hesabını birkaç adımda oluştur.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input
            type="text"
            placeholder="Ad Soyad"
            {...register("name")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
          />
          {errors.name ? <p className="text-xs text-red-400">{errors.name.message}</p> : null}
          <input
            type="email"
            placeholder="E-posta"
            {...register("email")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
          />
          {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
          <input
            type="password"
            placeholder="Şifre"
            {...register("password")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
          />
          {errors.password ? (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          ) : null}
          <input
            type="password"
            placeholder="Şifre Tekrar"
            {...register("confirmPassword")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#b44dff] focus:outline-none"
          />
          {errors.confirmPassword ? (
            <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#b44dff] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#9f33ee]"
          >
            {isSubmitting ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Zaten hesabın var mı?{" "}
          <Link href="/auth/login" className="text-[#e0aaff] hover:text-[#f0d9ff]">
            Giriş yap
          </Link>
        </p>
      </section>
    </div>
  );
}
