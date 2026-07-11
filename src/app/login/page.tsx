"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loginParam = params.get("login");
    if (loginParam) {
      setLogin(loginParam);
      setPassword("");
    }
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login yoki parol noto'g'ri");
        return;
      }

      router.replace(data.redirectTo || "/");
      router.refresh();
    } catch {
      setError("Server bilan aloqa bo'lmadi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#0a84ff_0,#0b1220_35%,#030712_100%)] flex items-center justify-center p-6 overflow-hidden relative">
      <div className="absolute inset-0 opacity-20" aria-hidden>
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-400 blur-3xl" />
        <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-cyan-300 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 rounded-full bg-indigo-500 blur-3xl" />
      </div>

      <section className="relative w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] rounded-[32px] overflow-hidden border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-2xl">
        <div className="p-8 lg:p-12 text-white flex flex-col justify-between min-h-[560px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              MIZAAM ERP — secure panel access
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.05em] leading-tight">
              Admin, HR va xodimlar uchun alohida kirish tizimi
            </h1>
            <p className="text-white/60 mt-5 max-w-xl text-base leading-7">
              Har bir xodimga rol va panel ruxsatlari beriladi. Admin kompaniya va HR kirishlarini yaratadi, HR xodimlarni boshqaradi, xodim esa o'z vazifa va hisobot panelidan foydalanadi.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-10">
            {[
              ["Admin", "Faqat admin panel"],
              ["HR", "Katta korxona paneli"],
              ["Xodim", "Vazifa va hisobot"],
            ].map(([title, subtitle]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                <p className="font-semibold">{title}</p>
                <p className="text-xs text-white/45 mt-1">{subtitle}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-7 lg:p-10 flex items-center">
          <form onSubmit={submit} className="w-full space-y-5">
            <div>
              <p className="text-sm font-semibold text-[#0071e3] mb-2">Xush kelibsiz</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Tizimga kirish</h2>
              <p className="text-sm text-black/45 mt-2">Admin bergan login va parolni kiriting.</p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-2 uppercase tracking-wider">Login</span>
              <input
                autoFocus
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="apple-input w-full h-12"
                placeholder="Loginni kiriting"
                autoComplete="username"
                required
              />
            </label>

            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-2 uppercase tracking-wider">Parol</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="apple-input w-full h-12 pr-16"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-black/40 hover:text-black/70"
                >
                  {showPassword ? "Yopish" : "Ko'rish"}
                </button>
              </div>
            </label>

            <button disabled={loading} className="apple-btn w-full h-12 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Tekshirilmoqda..." : "Kirish"}
            </button>

          </form>
        </div>
      </section>
    </main>
  );
}
