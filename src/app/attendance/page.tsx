"use client";

import { useEffect, useState } from "react";

interface AttendanceRecord {
  id: number; userId: number; date: string;
  checkIn: string | null; checkOut: string | null;
  status: string; reason: string | null;
  firstName: string; lastName: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState("30");

  useEffect(() => {
    fetch(`/api/attendance?days=${days}`).then((r) => r.json()).then(setRecords).finally(() => setLoading(false));
  }, [days]);

  const total = records.length;
  const present = records.filter((r) => r.status === "keldi").length;
  const late = records.filter((r) => r.status === "kechikdi").length;
  const absent = records.filter((r) => r.status === "kelmadi").length;
  const rate = total > 0 ? Math.round((present / (present + late + absent)) * 100) : 0;

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Davomat</h1><p>Xodimlar davomati monitoringi</p></div>
        <select value={days} onChange={(e) => setDays(e.target.value)} className="apple-input w-28">
          <option value="7">7 kun</option>
          <option value="14">14 kun</option>
          <option value="30">30 kun</option>
          <option value="60">60 kun</option>
        </select>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="apple-card p-4"><p className="apple-stat-label">Jami yozuvlar</p><p className="apple-stat-value text-black/80">{total}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Kelganlar</p><p className="apple-stat-value text-emerald-600">{present}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Kechikkanlar</p><p className="apple-stat-value text-amber-600">{late}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Kelmaganlar</p><p className="apple-stat-value text-red-600">{absent}</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Davomat foizi</p><p className="apple-stat-value apple-gradient">{rate}%</p></div>
      </div>

      {rate < 80 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="font-semibold text-amber-800 text-sm">⚠️ Yaxshilash tavsiyalari</p>
          <p className="text-sm text-amber-700 mt-1">Davomat foizi {rate}%. Kechikishlarni kamaytirish choralarini ko'rib chiqing.</p>
        </div>
      )}

      <div className="apple-card overflow-hidden">
        <table className="apple-table">
          <thead><tr><th>Sana</th><th>Xodim</th><th>Kelish</th><th>Ketish</th><th>Holat</th><th>Sabab</th></tr></thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="text-black/60">{new Date(r.date).toLocaleDateString("uz-UZ")}</td>
                <td className="font-medium text-black/80">{r.firstName} {r.lastName}</td>
                <td className="text-black/50">{r.checkIn ? new Date(r.checkIn).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td className="text-black/50">{r.checkOut ? new Date(r.checkOut).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td><span className={`apple-badge ${r.status === "keldi" ? "bg-emerald-100 text-emerald-700" : r.status === "kechikdi" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>{r.status === "keldi" ? "Keldi" : r.status === "kechikdi" ? "Kechikdi" : "Kelmadi"}</span></td>
                <td className="text-[11px] text-black/30">{r.reason || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>;
}
