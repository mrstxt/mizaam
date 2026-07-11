"use client";

import { useEffect, useState } from "react";

interface Report { id: number; userId: number; date: string; content: string; status: string; rejectionReason: string | null; firstName: string; lastName: string; }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/reports?${params}`).then((r) => r.json()).then(setReports).finally(() => setLoading(false));
  }, [statusFilter]);

  const handleAction = async (id: number, status: string, rejectionReason = "") => {
    await fetch("/api/reports", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, rejectionReason }) });
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    setReports(await (await fetch(`/api/reports?${params}`)).json());
  };

  if (loading) return <Loading />;

  const pending = reports.filter((r) => r.status === "kutilmoqda").length;
  const approved = reports.filter((r) => r.status === "tasdiqlangan").length;
  const rejected = reports.filter((r) => r.status === "rad_etilgan").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Kunlik hisobotlar</h1><p>Xodimlardan kelgan hisobotlar</p></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="apple-card p-4"><p className="apple-stat-label text-amber-600">Kutilmoqda</p><p className="apple-stat-value text-amber-600">{pending}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label text-emerald-600">Tasdiqlangan</p><p className="apple-stat-value text-emerald-600">{approved}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label text-red-600">Rad etilgan</p><p className="apple-stat-value text-red-600">{rejected}</p></div>
      </div>
      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="apple-input w-44">
          <option value="">Barcha</option><option value="kutilmoqda">Kutilmoqda</option><option value="tasdiqlangan">Tasdiqlangan</option><option value="rad_etilgan">Rad etilgan</option>
        </select>
      </div>
      <div className="space-y-3">
        {reports.map((r) => (
          <div key={r.id} className="apple-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{r.firstName} {r.lastName}</span>
                  <span className="text-xs text-black/30">{new Date(r.date).toLocaleDateString("uz-UZ")}</span>
                  <span className={`apple-badge ${r.status === "tasdiqlangan" ? "bg-emerald-100 text-emerald-700" : r.status === "rad_etilgan" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                    {r.status === "tasdiqlangan" ? "Tasdiqlangan" : r.status === "rad_etilgan" ? "Rad etilgan" : "Kutilmoqda"}
                  </span>
                </div>
                <p className="text-sm text-black/60 mt-2">{r.content}</p>
                {r.rejectionReason && <p className="text-xs text-red-500 mt-1">Sabab: {r.rejectionReason}</p>}
              </div>
              {r.status === "kutilmoqda" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleAction(r.id, "tasdiqlangan")} className="apple-btn text-[11px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 min-w-0">✅ Tasdiqlash</button>
                  <button onClick={() => { const reason = prompt("Rad etish sababi:"); if (reason) handleAction(r.id, "rad_etilgan", reason); }} className="apple-btn text-[11px] px-3 py-1.5 bg-red-500 hover:bg-red-600 min-w-0">❌ Rad etish</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {reports.length === 0 && <p className="text-center text-black/30 py-12 text-sm">Hisobotlar topilmadi</p>}
      </div>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>;
}
