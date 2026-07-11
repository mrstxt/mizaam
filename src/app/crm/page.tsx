"use client";
import { useEffect, useState } from "react";

interface Lead { id: number; name: string; phone: string; source: string; assignedTo: number | null; stage: string; slaDeadline: string | null; lostReason: string | null; wonAmount: number; wonAt: string | null; lostAt: string | null; createdAt: string; assigneeFirstName: string | null; assigneeLastName: string | null; }
interface Employee { id: number; firstName: string; lastName: string; }

const stages = [
  { key: "yangi_lid", label: "Yangi lid", color: "bg-white" },
  { key: "boglanildi", label: "Bog'lanildi", color: "bg-blue-50" },
  { key: "qiziqish_bildirdi", label: "Qiziqish", color: "bg-indigo-50" },
  { key: "taklif_yuborildi", label: "Taklif", color: "bg-purple-50" },
  { key: "muzokara", label: "Muzokara", color: "bg-orange-50" },
  { key: "golib", label: "G'olib", color: "bg-emerald-50" },
  { key: "yutqazilgan", label: "Yo'qotilgan", color: "bg-red-50" },
];

const sourceLabels: Record<string, string> = { telegram: "Telegram", sayt: "Sayt", qolda: "Qo'lda", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook" };

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [lostReasons, setLostReasons] = useState<{ id: number; reason: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [detailLead, setDetailLead] = useState<Lead & { notes?: { id: number; content: string; createdAt: string; firstName: string; lastName: string }[] } | null>(null);
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", source: "qolda", assignedTo: 0 });

  const fetchLeads = () => { fetch("/api/leads").then((r) => r.json()).then(setLeads).finally(() => setLoading(false)); };
  useEffect(() => { fetchLeads(); fetch("/api/users?status=ishlaydi").then((r) => r.json()).then(setEmployees); fetch("/api/lost-reasons").then((r) => r.json()).then(setLostReasons); }, []);

  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.status === 409) { const d = await res.json(); alert(`Bu telefon raqam bilan lid mavjud (ID: ${d.existingId})`); return; } setShowForm(false); setForm({ name: "", phone: "", source: "qolda", assignedTo: 0 }); fetchLeads(); };

  const moveStage = async (lead: Lead, newStage: string) => {
    const update: Record<string, unknown> = { stage: newStage, assignedTo: lead.assignedTo || 1 };
    if (newStage === "yutqazilgan") { const reason = prompt("Yo'qotish sababi:\n" + lostReasons.map((r) => `${r.id}. ${r.reason}`).join("\n")); if (!reason) return; update.lostReason = reason; }
    if (newStage === "golib") { const amount = prompt("Bitim summasi (so'm):"); if (!amount) return; update.wonAmount = Number(amount); }
    await fetch("/api/leads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: lead.id, ...update }) }); fetchLeads();
  };

  const addNote = async () => { if (!detailLead || !note.trim()) return; await fetch("/api/leads", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: detailLead.id, assignedTo: detailLead.assignedTo || 1, note }) }); setNote(""); const res = await fetch(`/api/leads/${detailLead.id}`); setDetailLead(await res.json()); };

  const isSlaBreached = (lead: Lead) => lead.slaDeadline && new Date(lead.slaDeadline) < new Date() && lead.stage !== "golib" && lead.stage !== "yutqazilgan";

  const openDetail = async (lead: Lead) => { const res = await fetch(`/api/leads/${lead.id}`); setDetailLead(await res.json()); };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Sotuv voronkasi</h1><p>Lidlar va mijozlar boshqaruvi</p></div>
        <button onClick={() => setShowForm(true)} className="apple-btn text-xs">+ Yangi lid</button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: "thin" }}>
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.stage === stage.key);
          return (
            <div key={stage.key} className={`flex-shrink-0 w-64 rounded-2xl p-3 border border-black/[0.06] ${stage.color}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-semibold text-black/70">{stage.label}</h3>
                <span className="text-xs bg-white/80 px-2 py-0.5 rounded-full font-medium text-black/40">{stageLeads.length}</span>
              </div>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div key={lead.id} className={`apple-card p-3 cursor-pointer ${isSlaBreached(lead) ? "ring-2 ring-red-400" : ""}`} onClick={() => openDetail(lead)}>
                    <p className="font-medium text-sm text-black/80">{lead.name}</p>
                    <p className="text-xs text-black/40">{lead.phone}</p>
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <span className="text-[10px] bg-black/5 px-1.5 py-0.5 rounded text-black/50">{sourceLabels[lead.source] || lead.source}</span>
                      {isSlaBreached(lead) && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">SLA!</span>}
                    </div>
                    {lead.assigneeFirstName && <p className="text-[10px] text-black/30 mt-1">👤 {lead.assigneeFirstName}</p>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {detailLead && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setDetailLead(null)}>
          <div className="apple-modal w-full max-w-lg max-h-[85vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6"><h2 className="text-xl font-bold">{detailLead.name}</h2><button onClick={() => setDetailLead(null)} className="text-black/30 hover:text-black/60 text-lg">✕</button></div>
            <div className="space-y-2 text-sm text-black/70">
              <p><strong className="text-black/80">Telefon:</strong> {detailLead.phone}</p>
              <p><strong className="text-black/80">Manba:</strong> {sourceLabels[detailLead.source] || detailLead.source}</p>
              <p><strong className="text-black/80">Bosqich:</strong> {stages.find((s) => s.key === detailLead.stage)?.label}</p>
              <p><strong className="text-black/80">Mas'ul:</strong> {detailLead.assigneeFirstName || "—"}</p>
              <p><strong className="text-black/80">SLA:</strong> {detailLead.slaDeadline ? new Date(detailLead.slaDeadline).toLocaleString("uz-UZ") : "—"}</p>
              {detailLead.wonAmount > 0 && <p><strong className="text-black/80">Summa:</strong> {(detailLead.wonAmount / 1_000_000).toFixed(1)} mln</p>}
              {detailLead.lostReason && <p><strong className="text-black/80">Yo'qotish sababi:</strong> {detailLead.lostReason}</p>}
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              {stages.filter((s) => s.key !== detailLead.stage && s.key !== "golib" && s.key !== "yutqazilgan").map((s) => (
                <button key={s.key} onClick={() => moveStage(detailLead, s.key)} className="text-xs px-3 py-1.5 bg-black/5 text-black/60 rounded-full hover:bg-black/10 transition-colors">→ {s.label}</button>
              ))}
              {detailLead.stage !== "golib" && detailLead.stage !== "yutqazilgan" && (<>
                <button onClick={() => moveStage(detailLead, "golib")} className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full hover:bg-emerald-200 transition-colors">🏆 G'olib</button>
                <button onClick={() => moveStage(detailLead, "yutqazilgan")} className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors">❌ Yo'qotilgan</button>
              </>)}
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Izohlar</h3>
              <div className="flex gap-2 mb-3"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Izoh qo'shish..." className="apple-input flex-1" /><button onClick={addNote} className="apple-btn text-xs">Qo'shish</button></div>
              {detailLead.notes?.map((n) => (
                <div key={n.id} className="p-3 bg-black/[0.02] rounded-xl mb-2">
                  <p className="text-sm text-black/70">{n.content}</p>
                  <p className="text-xs text-black/30 mt-0.5">{n.firstName} {n.lastName} • {new Date(n.createdAt).toLocaleString("uz-UZ")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="apple-modal w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Yangi lid</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Ism</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Telefon</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Manba</label><select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="apple-input w-full"><option value="telegram">Telegram</option><option value="sayt">Sayt</option><option value="qolda">Qo'lda</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option></select></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Mas'ul xodim</label><select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: Number(e.target.value) })} className="apple-input w-full"><option value={0}>Tanlang...</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}</select></div>
              <div className="flex gap-3 justify-end pt-2"><button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor</button><button type="submit" className="apple-btn">Qo'shish</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
