"use client";

import { useEffect, useState } from "react";

interface Payment {
  id: number;
  tenantId: number;
  amount: number;
  plan: string;
  paymentMethod: string;
  status: string;
  invoiceNumber: string | null;
  paidAt: string | null;
  createdAt: string;
  tenantName: string;
  tenantDomain: string;
}

interface Tenant {
  id: number;
  name: string;
  monthlyFee: number;
  plan: string;
}

export default function SuperAdminBillingPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tenantId: 0,
    amount: 3500000,
    plan: "Premium + Face ID",
    paymentMethod: "payme",
    status: "paid",
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
  });

  const fetchData = () => {
    fetch("/api/superadmin/billing")
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    fetch("/api/superadmin/tenants?status=active")
      .then((r) => r.json())
      .then(setTenants);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId) {
      alert("Iltimos, korxonani tanlang!");
      return;
    }
    await fetch("/api/superadmin/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        paidAt: form.status === "paid" ? new Date().toISOString() : null,
      }),
    });
    setShowForm(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-black/90">💳 SaaS To&apos;lovlar &amp; MRR Hisob-fakturalar</h1>
          <p className="text-sm text-black/50 mt-1">
            Korxona mijozlaridan kelib tushadigan barcha abonent to&apos;lovlari va faktura monitoringi
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs font-semibold px-5 py-2.5"
        >
          + Hisob-faktura (Invoice) yaratish
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="apple-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Jami yig&apos;ilgan tushum</p>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">
            {(totalPaid / 1_000_000).toFixed(2)}M <span className="text-sm text-black/40 font-normal">so&apos;m</span>
          </p>
          <p className="text-xs text-black/40 mt-1">Payme / Click va bank orqali</p>
        </div>

        <div className="apple-card p-5 border-l-4 border-l-amber-500">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">Kutilayotgan (Pending) to&apos;lovlar</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">
            {(totalPending / 1_000_000).toFixed(2)}M <span className="text-sm text-black/40 font-normal">so&apos;m</span>
          </p>
          <p className="text-xs text-black/40 mt-1">Yangilanishi kutilayotgan korxonalar</p>
        </div>

        <div className="apple-card p-5 border-l-4 border-l-[#0071e3]">
          <p className="text-[11px] font-bold text-black/40 uppercase tracking-wider">To&apos;lov usullari taqsimoti</p>
          <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-black/70">
            <span className="px-2.5 py-1 bg-cyan-100 text-cyan-800 rounded-full">Payme: 62%</span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">Bank: 28%</span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">Click: 10%</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="apple-card overflow-hidden">
        <table className="apple-table">
          <thead>
            <tr>
              <th>Faktura №</th>
              <th>Mijoz Korxona</th>
              <th>Tarif (Plan)</th>
              <th>To&apos;lov tizimi</th>
              <th>Sana</th>
              <th>Summa</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((pay) => (
              <tr key={pay.id}>
                <td className="font-mono text-xs font-bold text-black/60">{pay.invoiceNumber || "—"}</td>
                <td className="font-bold text-black/90">
                  {pay.tenantName}
                  <span className="block text-[11px] font-normal font-mono text-black/40">
                    https://mizaam.onrender.com/{pay.tenantDomain}/login
                  </span>
                </td>
                <td className="text-black/70 font-medium">{pay.plan}</td>
                <td>
                  <span className="px-2.5 py-1 rounded-full bg-black/5 text-black/70 font-semibold text-xs uppercase">
                    {pay.paymentMethod}
                  </span>
                </td>
                <td className="text-black/50 text-xs">
                  {pay.paidAt
                    ? new Date(pay.paidAt).toLocaleDateString("uz-UZ", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : new Date(pay.createdAt).toLocaleDateString("uz-UZ")}
                </td>
                <td className="font-bold text-emerald-600 text-right">
                  +{(pay.amount / 1_000_000).toFixed(2)}M so&apos;m
                </td>
                <td>
                  <span
                    className={`apple-badge ${
                      pay.status === "paid"
                        ? "bg-emerald-100 text-emerald-700"
                        : pay.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {pay.status === "paid" ? "To'landi" : pay.status === "pending" ? "Kutilmoqda" : "Xato"}
                  </span>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-10 text-black/30">
                  To&apos;lovlar yozuvlari topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div className="apple-modal w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 text-black/90">Yangi Hisob-faktura yaratish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1.5">Mijoz Korxona</label>
                <select
                  value={form.tenantId}
                  onChange={(e) => {
                    const t = tenants.find((item) => item.id === Number(e.target.value));
                    setForm({
                      ...form,
                      tenantId: Number(e.target.value),
                      amount: t ? t.monthlyFee : form.amount,
                      plan: t ? `${t.plan.toUpperCase()} Tarif` : form.plan,
                    });
                  }}
                  required
                  className="apple-input w-full"
                >
                  <option value={0}>Korxonani tanlang...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.plan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Faktura raqami</label>
                  <input
                    value={form.invoiceNumber}
                    onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
                    required
                    className="apple-input w-full font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">To&apos;lov usuli</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="apple-input w-full"
                  >
                    <option value="payme">Payme</option>
                    <option value="click">Click</option>
                    <option value="bank_transfer">Bank o&apos;tkazmasi</option>
                    <option value="cash">Naqd</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Tarif tavsifi</label>
                  <input
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    required
                    className="apple-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Summa (so&apos;m)</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                    required
                    className="apple-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1.5">Holati</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="apple-input w-full"
                >
                  <option value="paid">To&apos;landi (Paid)</option>
                  <option value="pending">Kutilmoqda (Pending invoice)</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">
                  Bekor
                </button>
                <button type="submit" className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
