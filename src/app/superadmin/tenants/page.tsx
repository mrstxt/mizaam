"use client";

import { useEffect, useState } from "react";

interface AccessDetails { tenantId?: number; userId?: number; role?: string; tenantLogin?: string; login: string; password: string; loginUrl: string; }

interface Tenant {
  id: number;
  name: string;
  domainPrefix: string;
  plan: string;
  status: string;
  hasFaceIdModule: boolean;
  hasCrmModule: boolean;
  employeeCount: number;
  maxEmployees: number;
  monthlyFee: number;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export default function TenantsManagementPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tenantAccess, setTenantAccess] = useState<AccessDetails | null>(null);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    domainPrefix: "",
    plan: "pro",
    status: "active",
    hasFaceIdModule: false,
    hasCrmModule: true,
    maxEmployees: 50,
    monthlyFee: 2000000,
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    hrLogin: "",
    hrPassword: "",
  });

  const fetchTenants = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (planFilter) params.set("plan", planFilter);
    if (search) params.set("search", search);
    fetch(`/api/superadmin/tenants?${params}`)
      .then((r) => r.json())
      .then(setTenants)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter, planFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const response = await fetch("/api/superadmin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Korxona qo'shilmadi");
      return;
    }
    if (data.access) setTenantAccess(data.access);
    setShowForm(false);
    setForm({
      name: "",
      domainPrefix: "",
      plan: "pro",
      status: "active",
      hasFaceIdModule: false,
      hasCrmModule: true,
      maxEmployees: 50,
      monthlyFee: 2000000,
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      hrLogin: "",
      hrPassword: "",
    });
    fetchTenants();
  };

  const resetHrAccess = async (id: number) => {
    setError("");
    const response = await fetch(`/api/superadmin/tenants/${id}/access`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "HR link yaratilmadi");
      return;
    }
    setTenantAccess(data.access);
  };

  const toggleModule = async (id: number, moduleKey: "hasFaceIdModule" | "hasCrmModule", currentVal: boolean) => {
    await fetch(`/api/superadmin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [moduleKey]: !currentVal }),
    });
    setTenants(tenants.map((t) => (t.id === id ? { ...t, [moduleKey]: !currentVal } : t)));
  };

  const changeStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/superadmin/tenants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setTenants(tenants.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
  };

  const deleteTenant = async (id: number) => {
    if (!confirm("Bu korxonani va uning barcha ma'lumotlarini o'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/superadmin/tenants/${id}`, { method: "DELETE" });
    fetchTenants();
  };

  const handleDomainPrefixChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9]/g, "");
    setForm((current) => ({
      ...current,
      domainPrefix: clean,
      hrLogin: current.hrLogin ? current.hrLogin : clean ? `${clean}.hr` : "",
    }));
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-black/90">🏢 Korxonalar (Tenants) Boshqaruvi</h1>
          <p className="text-sm text-black/50 mt-1">
            Mizaam platformasida ro&apos;yxatdan o&apos;tgan barcha mijoz kompaniyalar va ularning modullari
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs font-semibold px-5 py-2.5"
        >
          + Yangi Korxona qo&apos;shish
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="🔍 Korxona nomi..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="apple-input w-64"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="apple-input">
          <option value="">Barcha holatlar</option>
          <option value="active">Faol (Active)</option>
          <option value="trial">Sinov (Trial)</option>
          <option value="suspended">To&apos;xtatilgan</option>
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="apple-input">
          <option value="">Barcha tariflar</option>
          <option value="trial">Trial</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

      {tenantAccess && (
        <div className="apple-card p-5 border border-emerald-200 bg-emerald-50/70">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-emerald-800">HR panel linki tayyor</p>
              <p className="text-xs text-emerald-700/80 mt-1">Kompaniya HR'iga shu link va parolni yuboring. HR linkni ochib faqat parol kiritadi.</p>
              <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs">
                <div className="rounded-xl bg-white/70 p-3"><p className="text-black/40">Kompaniya login</p><p className="font-mono font-semibold text-black/80">{tenantAccess.tenantLogin || "—"}</p></div>
                <div className="rounded-xl bg-white/70 p-3"><p className="text-black/40">HR parol</p><p className="font-mono font-semibold text-black/80">{tenantAccess.password}</p></div>
                <div className="rounded-xl bg-white/70 p-3"><p className="text-black/40">Panel linki</p><a className="font-mono font-semibold text-[#0071e3] break-all" href={tenantAccess.loginUrl} target="_blank">{tenantAccess.loginUrl}</a></div>
              </div>
            </div>
            <button onClick={() => navigator.clipboard.writeText(`Link: ${tenantAccess.loginUrl}
Parol: ${tenantAccess.password}`)} className="apple-btn text-xs shrink-0">Copy</button>
          </div>
        </div>
      )}

      {/* Tenants Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tenants.map((t) => (
          <div key={t.id} className="apple-card p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-black/90">{t.name}</h3>
                  <p className="text-xs font-mono text-black/50">{t.domainPrefix}.mizaam.uz</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`apple-badge capitalize ${
                      t.plan === "enterprise"
                        ? "bg-purple-100 text-purple-800 border border-purple-300"
                        : t.plan === "premium"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : t.plan === "pro"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {t.plan}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      t.status === "active"
                        ? "bg-emerald-100 text-emerald-700"
                        : t.status === "trial"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.status === "active" ? "Faol" : t.status === "trial" ? "Sinov" : "To'xtatilgan"}
                  </span>
                </div>
              </div>

              {/* Contact and Stats Info */}
              <div className="grid grid-cols-2 gap-2 text-xs text-black/60 bg-black/[0.02] p-3 rounded-xl mb-4">
                <div>
                  <p className="text-black/40 text-[10px] uppercase font-bold">Xodimlar limiti</p>
                  <p className="font-semibold text-black/80 mt-0.5">
                    {t.employeeCount} / {t.maxEmployees} kishi
                  </p>
                </div>
                <div>
                  <p className="text-black/40 text-[10px] uppercase font-bold">Oylik to&apos;lov</p>
                  <p className="font-semibold text-amber-600 mt-0.5">
                    {(t.monthlyFee / 1_000_000).toFixed(1)}M so&apos;m
                  </p>
                </div>
                {t.contactName && (
                  <div className="col-span-2 border-t border-black/5 pt-2 mt-1">
                    <p className="text-black/40 text-[10px] uppercase font-bold">Aloqa shaxsi</p>
                    <p className="font-medium text-black/80">
                      {t.contactName} • {t.contactPhone}
                    </p>
                  </div>
                )}
              </div>

              {/* Toggles for Modules */}
              <div className="space-y-2 border-t border-black/5 pt-3 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5 text-purple-700">
                    <span>⭐ Face ID (Computer Vision) moduli</span>
                  </span>
                  <button
                    onClick={() => toggleModule(t.id, "hasFaceIdModule", t.hasFaceIdModule)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      t.hasFaceIdModule ? "bg-purple-600" : "bg-black/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        t.hasFaceIdModule ? "left-5.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold flex items-center gap-1.5 text-blue-700">
                    <span>🎯 Sotuv Voronkasi (CRM) moduli</span>
                  </span>
                  <button
                    onClick={() => toggleModule(t.id, "hasCrmModule", t.hasCrmModule)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      t.hasCrmModule ? "bg-blue-600" : "bg-black/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        t.hasCrmModule ? "left-5.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between border-t border-black/5 pt-3 text-xs">
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => resetHrAccess(t.id)}
                  className="px-2.5 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200"
                >
                  HR link
                </button>
                {t.status !== "active" && (
                  <button
                    onClick={() => changeStatus(t.id, "active")}
                    className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200"
                  >
                    Faollashtirish
                  </button>
                )}
                {t.status === "active" && (
                  <button
                    onClick={() => changeStatus(t.id, "suspended")}
                    className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200"
                  >
                    To&apos;xtatish
                  </button>
                )}
              </div>
              <button
                onClick={() => deleteTenant(t.id)}
                className="text-black/30 hover:text-red-500 font-semibold transition-colors"
              >
                O&apos;chirish 🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add Tenant */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div className="apple-modal w-full max-w-xl max-h-[85vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 text-black/90">Yangi Mijoz Korxona qo&apos;shish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Korxona nomi</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="masalan: Orient Logistics MChJ"
                    className="apple-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Domain prefix (subdomain)</label>
                  <input
                    value={form.domainPrefix}
                    onChange={(e) => handleDomainPrefixChange(e.target.value)}
                    required
                    placeholder="orient"
                    className="apple-input w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Tarif rejasi</label>
                  <select
                    value={form.plan}
                    onChange={(e) => setForm({ ...form, plan: e.target.value })}
                    className="apple-input w-full"
                  >
                    <option value="trial">Trial (Sinov 14 kun)</option>
                    <option value="free">Free limit</option>
                    <option value="pro">Pro (Oylik 1.8M so&apos;m)</option>
                    <option value="premium">Premium + Face ID (3.5M so&apos;m)</option>
                    <option value="enterprise">Enterprise (Cheklanmagan)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Holat</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="apple-input w-full"
                  >
                    <option value="active">Faol (Active)</option>
                    <option value="trial">Sinov (Trial)</option>
                    <option value="suspended">To&apos;xtatilgan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Xodimlar limiti (Max)</label>
                  <input
                    type="number"
                    value={form.maxEmployees}
                    onChange={(e) => setForm({ ...form, maxEmployees: Number(e.target.value) })}
                    className="apple-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Oylik to&apos;lov (so&apos;m)</label>
                  <input
                    type="number"
                    value={form.monthlyFee}
                    onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
                    className="apple-input w-full"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                <div>
                  <p className="text-xs font-bold uppercase text-amber-700">HR panel kirish ma'lumotlari</p>
                  <p className="text-[11px] text-amber-700/70 mt-1">Kompaniya qo'shilishi uchun HR login va parolni admin kiritishi shart. HR shu login bilan katta korxona paneliga kiradi.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-black/60 mb-1">HR login</label>
                    <input
                      value={form.hrLogin}
                      onChange={(e) => setForm({ ...form, hrLogin: e.target.value.toLowerCase().replace(/\s/g, "") })}
                      required
                      placeholder="masalan: orient.hr"
                      className="apple-input w-full text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-black/60 mb-1">HR parol</label>
                    <input
                      type="password"
                      value={form.hrPassword}
                      onChange={(e) => setForm({ ...form, hrPassword: e.target.value })}
                      required
                      minLength={8}
                      placeholder="kamida 8 belgi"
                      className="apple-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-black/[0.02] rounded-xl space-y-3">
                <p className="text-xs font-bold uppercase text-black/40">Yoqilgan modullar</p>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-purple-700">
                  <input
                    type="checkbox"
                    checked={form.hasFaceIdModule}
                    onChange={(e) => setForm({ ...form, hasFaceIdModule: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>⭐ Computer Vision: Face ID Davomat Moduli</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-blue-700">
                  <input
                    type="checkbox"
                    checked={form.hasCrmModule}
                    onChange={(e) => setForm({ ...form, hasCrmModule: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>🎯 Sotuv Voronkasi (CRM) va SLA Nazorati</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1">Aloqa shaxsi</label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                    placeholder="Ism Familiya"
                    className="apple-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1">Telefon</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    placeholder="+99890..."
                    className="apple-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    placeholder="ceo@domain.uz"
                    className="apple-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-black/5">
                <button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">
                  Bekor qilish
                </button>
                <button type="submit" className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500">
                  Qo&apos;shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
