"use client";
import { useEffect, useState } from "react";
interface Ticket { id: number; userId: number; subject: string; message: string; status: string; response: string | null; createdAt: string; firstName: string; lastName: string; }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [responding, setResponding] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const fetchTickets = () => { fetch("/api/support").then((r) => r.json()).then(setTickets).finally(() => setLoading(false)); };
  useEffect(() => { fetchTickets(); }, []);

  const createTicket = async (e: React.FormEvent) => { e.preventDefault(); await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, userId: 1 }) }); setShowForm(false); setForm({ subject: "", message: "" }); fetchTickets(); };
  const respond = async (id: number) => { await fetch("/api/support", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "jarayonda", response: responseText }) }); setResponding(null); setResponseText(""); fetchTickets(); };
  const resolve = async (id: number) => { await fetch("/api/support", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "hal_qilindi" }) }); fetchTickets(); };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Support</h1><p>Tizim ishlab chiquvchilari bilan bog'lanish</p></div>
        <button onClick={() => setShowForm(true)} className="apple-btn text-xs">+ Yangi murojaat</button>
      </div>
      <div className="space-y-3">
        {tickets.map((t) => (
          <div key={t.id} className="apple-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{t.subject}</span>
                  <span className={`apple-badge ${t.status === "ochiq" ? "bg-red-100 text-red-700" : t.status === "jarayonda" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>{t.status === "ochiq" ? "Ochiq" : t.status === "jarayonda" ? "Jarayonda" : "Hal qilindi"}</span>
                </div>
                <p className="text-sm text-black/60 mt-2">{t.message}</p>
                <p className="text-xs text-black/30 mt-1">{t.firstName} {t.lastName} • {new Date(t.createdAt).toLocaleString("uz-UZ")}</p>
                {t.response && <div className="mt-3 p-3 bg-black/[0.02] rounded-xl"><p className="text-xs text-black/40 font-medium">Javob:</p><p className="text-sm text-black/70">{t.response}</p></div>}
              </div>
              <div className="flex gap-2 shrink-0">
                {t.status === "ochiq" && <button onClick={() => setResponding(t.id)} className="apple-btn text-[11px] px-3 py-1.5 bg-blue-500 hover:bg-blue-600 min-w-0">Javob berish</button>}
                {t.status === "jarayonda" && <button onClick={() => resolve(t.id)} className="apple-btn text-[11px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 min-w-0">Hal qilish</button>}
              </div>
            </div>
            {responding === t.id && (
              <div className="mt-3 flex gap-2">
                <input value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Javob matni..." className="apple-input flex-1" />
                <button onClick={() => respond(t.id)} className="apple-btn text-xs">Yuborish</button>
                <button onClick={() => setResponding(null)} className="apple-btn apple-btn-secondary text-xs">Bekor</button>
              </div>
            )}
          </div>
        ))}
      </div>
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="apple-modal w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Yangi murojaat</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Mavzu</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Xabar</label><textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={4} className="apple-input w-full" /></div>
              <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor</button><button type="submit" className="apple-btn">Yuborish</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
