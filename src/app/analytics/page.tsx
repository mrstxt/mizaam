"use client";
import { useEffect, useState } from "react";
interface AnalyticsData { kpiDistribution: { firstName: string; lastName: string; kpi: number | null; bonus: number | null; fine: number | null }[]; ranking: { rank: number; name: string; kpi: number | null; recommendation: string }[]; attendanceQuality: { present: number; late: number; absent: number }; taskStats: { total: number; completed: number; overdue: number }; leadStages: { stage: string; count: number }[]; }
const stageLabels: Record<string, string> = { yangi_lid: "Yangi", boglanildi: "Bog'lanildi", qiziqish_bildirdi: "Qiziqish", taklif_yuborildi: "Taklif", muzokara: "Muzokara", golib: "G'olib", yutqazilgan: "Yo'qotilgan" };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setData).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;
  if (!data) return <p className="text-center text-black/30 py-20">Xatolik</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Analitika</h1><p>KPI, davomat va xodimlar tahlili</p></div>

      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-4">KPI taqsimoti</h2>
        <div className="space-y-3">
          {data.kpiDistribution.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-sm w-24 truncate text-black/70">{item.firstName} {item.lastName}</span>
              <div className="flex-1 apple-progress">
                <div className="apple-progress-bar" style={{ width: `${Math.min(((item.kpi ?? 0) / 1_000_000) * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-medium text-black/50 w-16 text-right">{((item.kpi ?? 0) / 1_000_000).toFixed(1)}M</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="apple-card p-6">
          <h2 className="text-sm font-semibold mb-4">Xodimlar reytingi</h2>
          <div className="space-y-2">
            {data.ranking.map((r) => (
              <div key={r.rank} className="flex items-center gap-3 p-2 rounded-xl hover:bg-black/[0.02]">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${r.rank === 1 ? "bg-yellow-400 text-yellow-900" : r.rank === 2 ? "bg-slate-300 text-slate-700" : r.rank === 3 ? "bg-orange-300 text-orange-900" : "bg-black/5 text-black/40"}`}>{r.rank}</span>
                <span className="flex-1 text-sm font-medium text-black/80">{r.name}</span>
                <span className="text-xs text-black/30">KPI: {((r.kpi ?? 0) / 1_000_000).toFixed(1)}M</span>
                <span className={`apple-badge ${r.recommendation === "Lavozim ko'tarish" ? "bg-emerald-100 text-emerald-700" : r.recommendation === "Yordam kerak" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{r.recommendation}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="apple-card p-6">
            <h2 className="text-sm font-semibold mb-4">Davomat sifati</h2>
            <div className="flex gap-4 text-center">
              <div className="flex-1"><p className="text-2xl font-bold text-emerald-600">{data.attendanceQuality.present}</p><p className="text-xs text-black/40 mt-0.5">Keldi</p></div>
              <div className="flex-1"><p className="text-2xl font-bold text-amber-600">{data.attendanceQuality.late}</p><p className="text-xs text-black/40 mt-0.5">Kechikdi</p></div>
              <div className="flex-1"><p className="text-2xl font-bold text-red-600">{data.attendanceQuality.absent}</p><p className="text-xs text-black/40 mt-0.5">Kelmadi</p></div>
            </div>
          </div>
          <div className="apple-card p-6">
            <h2 className="text-sm font-semibold mb-4">Vazifalar statistikasi</h2>
            <div className="flex gap-4 text-center">
              <div className="flex-1"><p className="text-2xl font-bold text-black/80">{data.taskStats.total}</p><p className="text-xs text-black/40">Jami</p></div>
              <div className="flex-1"><p className="text-2xl font-bold text-emerald-600">{data.taskStats.completed}</p><p className="text-xs text-black/40">Bajarildi</p></div>
              <div className="flex-1"><p className="text-2xl font-bold text-red-600">{data.taskStats.overdue}</p><p className="text-xs text-black/40">Muddati o'tgan</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-4">Sotuv voronkasi</h2>
        <div className="flex items-end gap-2 h-32">
          {data.leadStages.map((s) => {
            const max = Math.max(...data.leadStages.map((l) => Number(l.count)), 1);
            return (
              <div key={s.stage} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-medium text-black/60">{Number(s.count)}</span>
                <div className="w-full rounded-t bg-[#0071e3]" style={{ height: `${(Number(s.count) / max) * 90}px`, opacity: 0.4 + (Number(s.count) / max) * 0.6 }} />
                <span className="text-[10px] text-black/40 text-center">{stageLabels[s.stage] || s.stage}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
