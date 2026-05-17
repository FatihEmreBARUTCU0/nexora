"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage(null);
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (!result || result.error) {
        setErrorMessage("E-posta veya şifre hatalı.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setErrorMessage("Giriş sırasında bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-220px)] w-full max-w-7xl items-center justify-center px-6 py-16 md:px-10">
      <section className="w-full max-w-md rounded-2xl border border-[#1f1f1f] bg-[#111111] p-8 md:p-10">
        <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">Giriş Yap</h1>
        <p className="mt-2 text-sm text-zinc-400">Nexora hesabınla devam et.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input
            type="email"
            placeholder="E-posta"
            {...register("email")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#6366f1] focus:outline-none"
          />
          {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
          <input
            type="password"
            placeholder="Şifre"
            {...register("password")}
            className="w-full rounded-xl border border-[#2a2a2a] bg-[#0d0d0d] px-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:border-[#6366f1] focus:outline-none"
          />
          {errors.password ? (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          ) : null}
          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#6366f1] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5458e8]"
          >
            {isSubmitting ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Hesabın yok mu?{" "}
          <Link href="/auth/register" className="text-[#a5b4fc] hover:text-[#c7d2fe]">
            Kayıt ol
          </Link>
        </p>
      </section>
    </div>
  );
}
