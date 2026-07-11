"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CompanyLoginPage() {
  const router = useRouter();
  const params = useParams<{ company: string }>();
  const [companyLogin, setCompanyLogin] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const company = String(params.company || "").toLowerCase();
    const query = new URLSearchParams(window.location.search);
    setCompanyLogin(company);
    setLogin(query.get("login") || "");
  }, [params.company]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantLogin: companyLogin, login: login || undefined, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Parol noto'g'ri");
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

      <section className="relative w-full max-w-4xl grid lg:grid-cols-[1fr_0.95fr] rounded-[32px] overflow-hidden border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-2xl">
        <div className="p-8 lg:p-12 text-white flex flex-col justify-between min-h-[520px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/70 mb-8">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              MIZAAM ERP — kompaniya paneli
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.05em] leading-tight">
              {companyLogin ? `${companyLogin} kompaniyasi` : "Kompaniya"} HR paneliga kirish
            </h1>
            <p className="text-white/60 mt-5 max-w-xl text-base leading-7">
              Bu link kompaniya uchun maxsus. Admin bergan HR parolni kiriting va korxona boshqaruv paneliga o'ting.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4 mt-10">
            <p className="text-xs text-white/45">Panel linki</p>
            <p className="font-mono text-sm text-white/80 mt-1 break-all">/{companyLogin || "kompaniya"}/login</p>
          </div>
        </div>

        <div className="bg-white p-7 lg:p-10 flex items-center">
          <form onSubmit={submit} className="w-full space-y-5">
            <div>
              <p className="text-sm font-semibold text-[#0071e3] mb-2">HR panel</p>
              <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f]">Parolni kiriting</h2>
              <p className="text-sm text-black/45 mt-2">Kompaniya: <span className="font-mono font-semibold text-black/70">{companyLogin || "—"}</span></p>
              {login && <p className="text-sm text-black/45 mt-1">Login: <span className="font-mono font-semibold text-black/70">{login}</span></p>}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-2 uppercase tracking-wider">Parol</span>
              <div className="relative">
                <input
                  autoFocus
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

            <button disabled={loading || !companyLogin} className="apple-btn w-full h-12 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? "Tekshirilmoqda..." : "Panelga kirish"}
            </button>

            <p className="text-xs text-black/35 leading-5">
              Agar parol esdan chiqqan bo'lsa, platforma adminidan yangi HR link/parol so'rang.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
