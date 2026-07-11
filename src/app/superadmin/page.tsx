"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface SuperAdminData {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  mrr: number;
  totalEmployees: number;
  recentPayments: {
    id: number;
    tenantId: number;
    amount: number;
    plan: string;
    paymentMethod: string;
    status: string;
    invoiceNumber: string | null;
    paidAt: string | null;
    tenantName: string;
  }[];
  metrics: {
    cpuUsage: number;
    ramUsage: number;
    dbSizeMb: number;
    activeBotsCount: number;
    totalApiRequests: number;
  };
  allTenants: {
    id: number;
    name: string;
    domainPrefix: string;
    plan: string;
    status: string;
    hasFaceIdModule: boolean;
    employeeCount: number;
    monthlyFee: number;
  }[];
  planBreakdown: { plan: string; count: number }[];
}

const planColors: Record<string, string> = {
  trial: "bg-slate-100 text-slate-700",
  free: "bg-slate-100 text-slate-700",
  pro: "bg-blue-100 text-blue-700",
  premium: "bg-amber-100 text-amber-800 border border-amber-300",
  enterprise: "bg-purple-100 text-purple-800 border border-purple-300",
};

export default function SuperAdminDashboard() {
  const [data, setData] = useState<SuperAdminData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superadmin")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTimeout(() => setLoading(false), 250);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-black/40 font-medium">Platforma ma&apos;lumotlari yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 py-20">Xatolik yuz berdi</p>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              SUPERADMIN CORE
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-black/90">
              Mizaam Platforma Paneli
            </h1>
          </div>
          <p className="text-sm text-black/50 mt-1.5">
            SaaS Boshqaruv Markazi — O&apos;zimiz uchun: barcha mijoz korxonalar, to&apos;lovlar, Face ID modullari va serverlar nazorati
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/superadmin/tenants"
            className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-sm text-xs font-semibold py-2.5 px-4"
          >
            + Korxona (Tenant) qo&apos;shish
          </Link>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="apple-card p-5 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Oylik daromad (MRR)</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {(data.mrr / 1_000_000).toFixed(1)}M <span className="text-sm text-black/40 font-normal">so&apos;m</span>
          </p>
        </div>
        <div className="apple-card p-5">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Jami Korxonalar</p>
          <p className="text-2xl font-extrabold text-black/80 mt-1">{data.totalTenants} ta</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ {data.activeTenants} ta faol</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Jami End Users</p>
          <p className="text-2xl font-extrabold text-[#0071e3] mt-1">{data.totalEmployees} kishi</p>
          <p className="text-[11px] text-black/40 mt-1">xodimlar bazasida</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Face ID modullari ⭐</p>
          <p className="text-2xl font-extrabold text-purple-600 mt-1">
            {data.allTenants.filter((t) => t.hasFaceIdModule).length} ta
          </p>
          <p className="text-[11px] text-purple-500 mt-1">kamera-davomat ulanishi</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Active Telegram Botlar</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{data.metrics.activeBotsCount} ta</p>
          <p className="text-[11px] text-black/40 mt-1">real-time webhook</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Trial / Sinov</p>
          <p className="text-2xl font-extrabold text-orange-600 mt-1">{data.trialTenants} ta</p>
          <p className="text-[11px] text-orange-600 font-medium mt-1">Sotuv bo&apos;limiga ogohlantirish</p>
        </div>
      </div>

      {/* Server & Health Metrics */}
      <div className="apple-card p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-amber-400">
              <span>🖥️ Tizim Serverlari &amp; Database Health Monitoring</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                All Clusters Healthy
              </span>
            </h2>
            <p className="text-xs text-white/50 mt-1">
              O&apos;zbekiston hududidagi ma&apos;lumotlar markazi (Toshkent DC-1) real-time holati
            </p>
          </div>
          <div className="text-right text-xs text-white/40 font-mono">
            Uptime: 99.98% • API Avg latency: 14ms
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>CPU usage</span>
              <span className="text-emerald-400 font-bold">{data.metrics.cpuUsage}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${data.metrics.cpuUsage}%` }} />
            </div>
            <p className="text-[10px] text-white/30 mt-2">16 Cores • Intel Xeon Gold</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>RAM usage</span>
              <span className="text-blue-400 font-bold">{data.metrics.ramUsage}%</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${data.metrics.ramUsage}%` }} />
            </div>
            <p className="text-[10px] text-white/30 mt-2">30.8 GB / 64 GB used</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>PostgreSQL DB</span>
              <span className="text-amber-400 font-bold">{data.metrics.dbSizeMb} MB</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: "25%" }} />
            </div>
            <p className="text-[10px] text-white/30 mt-2">AES-256 Encrypted • Daily Backup</p>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <div className="flex items-center justify-between text-xs text-white/60 mb-1">
              <span>API Requests (24s)</span>
              <span className="text-purple-400 font-bold">{data.metrics.totalApiRequests.toLocaleString()}</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div className="bg-purple-400 h-full rounded-full" style={{ width: "68%" }} />
            </div>
            <p className="text-[10px] text-white/30 mt-2">4,120 req/min peak</p>
          </div>
        </div>
      </div>

      {/* Grid: Tenants List & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenants Table */}
        <div className="lg:col-span-2 apple-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-black/80">🏢 Korxonalar (Tenants) Holati</h2>
            <Link href="/superadmin/tenants" className="text-xs text-[#0071e3] hover:underline font-semibold">
              Barchasini ko&apos;rish ({data.allTenants.length}) →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="apple-table">
              <thead>
                <tr>
                  <th>Korxona nomi</th>
                  <th>Subdomain</th>
                  <th>Tarif (Plan)</th>
                  <th>Modullari</th>
                  <th>Xodimlar</th>
                  <th>Holati</th>
                </tr>
              </thead>
              <tbody>
                {data.allTenants.slice(0, 5).map((tenant) => (
                  <tr key={tenant.id}>
                    <td className="font-bold text-black/90">{tenant.name}</td>
                    <td className="font-mono text-xs text-black/50">{tenant.domainPrefix}.mizaam.uz</td>
                    <td>
                      <span className={`apple-badge capitalize ${planColors[tenant.plan] || "bg-slate-100"}`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {tenant.hasFaceIdModule && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                            ⭐ Face ID
                          </span>
                        )}
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          🎯 CRM
                        </span>
                      </div>
                    </td>
                    <td className="font-medium text-black/70">{tenant.employeeCount} kishi</td>
                    <td>
                      <span
                        className={`apple-badge ${
                          tenant.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : tenant.status === "trial"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {tenant.status === "active" ? "Faol" : tenant.status === "trial" ? "Sinov (Trial)" : "To'xtatilgan"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Revenue / Payments */}
        <div className="apple-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-black/80">💳 So&apos;nggi to&apos;lovlar (Revenue)</h2>
            <Link href="/superadmin/billing" className="text-xs text-[#0071e3] hover:underline font-semibold">
              Hisob-fakturalar →
            </Link>
          </div>
          <div className="space-y-3.5">
            {data.recentPayments.slice(0, 5).map((pay) => (
              <div key={pay.id} className="p-3.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-black/80">{pay.tenantName}</p>
                  <p className="text-[11px] text-black/40 mt-0.5">{pay.plan} • {pay.paymentMethod.toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-emerald-600">+{(pay.amount / 1_000_000).toFixed(2)}M</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                    pay.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {pay.status === "paid" ? "To'landi" : "Kutilmoqda"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
