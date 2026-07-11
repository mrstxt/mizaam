"use client";
import { useEffect, useState } from "react";
interface Finance { id: number; type: string; category: string; amount: number; description: string | null; date: string; }

export default function FinancePage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "daromad", category: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] });
  const fetchData = () => { fetch("/api/finances").then((r) => r.json()).then(setFinances).finally(() => setLoading(false)); };
  useEffect(() => { fetchData(); }, []);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); await fetch("/api/finances", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); setShowForm(false); setForm({ type: "daromad", category: "", amount: 0, description: "", date: new Date().toISOString().split("T")[0] }); fetchData(); };

  if (loading) return <Loading />;
  const income = finances.filter((f) => f.type === "daromad").reduce((s, f) => s + f.amount, 0);
  const expense = finances.filter((f) => f.type === "xarajat").reduce((s, f) => s + f.amount, 0);
  const net = income - expense;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Moliyaviy holat</h1><p>Kompaniya daromad va xarajatlari</p></div>
        <button onClick={() => setShowForm(true)} className="apple-btn text-xs">+ Qo'shish</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="apple-card p-4"><p className="apple-stat-label">Daromad</p><p className="apple-stat-value text-emerald-600">{(income / 1_000_000).toFixed(1)} mln</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Xarajat</p><p className="apple-stat-value text-red-600">{(expense / 1_000_000).toFixed(1)} mln</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Sof foyda</p><p className={`apple-stat-value ${net >= 0 ? "text-[#0071e3]" : "text-red-600}"}`}>{(net / 1_000_000).toFixed(1)} mln</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Oylik fond</p><p className="apple-stat-value text-black/80">{(income * 0.4 / 1_000_000).toFixed(1)} mln</p></div>
      </div>
      <div className="apple-card overflow-hidden">
        <table className="apple-table">
          <thead><tr><th>Sana</th><th>Tur</th><th>Kategoriya</th><th>Tavsif</th><th className="text-right">Summa</th></tr></thead>
          <tbody>{finances.map((f) => (
            <tr key={f.id}>
              <td className="text-black/60">{new Date(f.date).toLocaleDateString("uz-UZ")}</td>
              <td><span className={`apple-badge ${f.type === "daromad" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{f.type === "daromad" ? "Daromad" : "Xarajat"}</span></td>
              <td className="text-black/60">{f.category}</td>
              <td className="text-black/40 text-xs">{f.description || "—"}</td>
              <td className={`text-right font-semibold ${f.type === "daromad" ? "text-emerald-600" : "text-red-600"}`}>{f.type === "daromad" ? "+" : "-"}{(f.amount / 1_000_000).toFixed(2)} mln</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="apple-modal w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Yangi yozuv</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Tur</label><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="apple-input w-full"><option value="daromad">Daromad</option><option value="xarajat">Xarajat</option></select></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Kategoriya</label><input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="apple-input w-full" placeholder="masalan: Ofis arendasi" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Summa</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Tavsif</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Sana</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="apple-input w-full" /></div>
              <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor</button><button type="submit" className="apple-btn">Qo'shish</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
