"use client";

import { useEffect, useState } from "react";

interface PlatformUpdate {
  id: number;
  version: string;
  title: string;
  content: string;
  type: string;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default function SuperAdminUpdatesPage() {
  const [updates, setUpdates] = useState<PlatformUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    version: "v1.4.0",
    title: "",
    content: "",
    type: "feature",
    isPublished: true,
  });

  const fetchUpdates = () => {
    fetch("/api/superadmin/updates")
      .then((r) => r.json())
      .then(setUpdates)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/superadmin/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        publishedAt: form.isPublished ? new Date().toISOString() : null,
      }),
    });
    setShowForm(false);
    setForm({
      version: "v1.4.0",
      title: "",
      content: "",
      type: "feature",
      isPublished: true,
    });
    fetchUpdates();
  };

  const togglePublish = async (item: PlatformUpdate) => {
    await fetch("/api/superadmin/updates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: item.id,
        isPublished: !item.isPublished,
        publishedAt: !item.isPublished ? new Date().toISOString() : item.publishedAt,
      }),
    });
    fetchUpdates();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const typeBadge: Record<string, { label: string; color: string }> = {
    feature: { label: "Yangi imkoniyat", color: "bg-blue-100 text-blue-800 border-blue-200" },
    module: { label: "⭐ Premium Modul", color: "bg-purple-100 text-purple-800 border-purple-200" },
    security: { label: "🛡️ Xavfsizlik & Huquqiy", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
    fix: { label: "⚡ Tizim tuzatishi", color: "bg-amber-100 text-amber-800 border-amber-200" },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-black/90">🚀 Release Notes &amp; Global E&apos;lonlar</h1>
          <p className="text-sm text-black/50 mt-1">
            Barcha korxonalarning (Tenants) dashbordlariga yuboriladigan tizim yangiliklari va reliz e&apos;lonlari
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-xs font-semibold px-5 py-2.5"
        >
          + Yangi E&apos;lon (Broadcast) yaratish
        </button>
      </div>

      {/* Broadcast Feed */}
      <div className="space-y-4">
        {updates.map((up) => {
          const badge = typeBadge[up.type] || { label: up.type, color: "bg-slate-100 text-slate-800" };
          return (
            <div
              key={up.id}
              className={`apple-card p-6 transition-all ${
                !up.isPublished ? "opacity-60 border-dashed border-black/20" : "border-l-4 border-l-[#0071e3]"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-xs font-extrabold bg-black/90 text-white shadow-sm">
                    {up.version}
                  </span>
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                  {!up.isPublished && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      📝 Qoralama (Draft)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-black/40">
                    {up.publishedAt
                      ? new Date(up.publishedAt).toLocaleDateString("uz-UZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "E'lon qilinmagan"}
                  </span>
                  <button
                    onClick={() => togglePublish(up)}
                    className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
                      up.isPublished
                        ? "bg-black/5 text-black/60 hover:bg-black/10"
                        : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                    }`}
                  >
                    {up.isPublished ? "Qoralamaga o'tkazish" : "🚀 Dashbordlarga E'lon qilish"}
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-black/90 mb-2">{up.title}</h3>
              <p className="text-sm text-black/70 leading-relaxed whitespace-pre-wrap">{up.content}</p>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay"
          onClick={() => setShowForm(false)}
        >
          <div className="apple-modal w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6 text-black/90">Global Release E&apos;loni yaratish</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Versiya (Version)</label>
                  <input
                    value={form.version}
                    onChange={(e) => setForm({ ...form, version: e.target.value })}
                    required
                    placeholder="v1.4.0"
                    className="apple-input w-full font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-black/60 mb-1.5">Yangilik turi</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="apple-input w-full"
                  >
                    <option value="feature">Yangi imkoniyat (Feature)</option>
                    <option value="module">⭐ Premium Modul (Face ID / CRM)</option>
                    <option value="security">🛡️ Xavfsizlik va Huquqiy muvofiqlik</option>
                    <option value="fix">⚡ Tizim yangilanishi va tezlik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1.5">Sarlavha (Title)</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  placeholder="masalan: ⭐ Computer Vision: Face ID Davomat moduli qo'shildi!"
                  className="apple-input w-full font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-black/60 mb-1.5">Batafsil matn (Content)</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                  placeholder="Yangilik haqida to'liq ma'lumot..."
                  className="apple-input w-full text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="pub"
                  checked={form.isPublished}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="pub" className="text-sm font-semibold text-black/80 cursor-pointer">
                  Darhol barcha korxonalar dashbordida e&apos;lon qilinsin
                </label>
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
