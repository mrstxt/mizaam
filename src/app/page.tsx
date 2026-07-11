"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  activeTasks: number;
  pendingReports: number;
  totalEmployees: number;
  todayPresent: number;
  todayLate: number;
  todayAbsent: number;
  attendanceTrend: { date: string; present: number; late: number; absent: number }[];
  topEmployees: { id: number; firstName: string; lastName: string; kpi: number | null }[];
  leadsByStage: { stage: string; count: number }[];
  slaBreached: number;
  wonDealsCount: number;
  wonDealsTotal: number;
  conversionRate: number;
  recentActivities: { id: number; action: string; details: string | null; createdAt: string; firstName: string | null; lastName: string | null }[];
  todayAttendance: { id: number; userId: number; firstName: string; lastName: string; checkIn: string | null; checkOut: string | null; status: string }[];
}

const stageLabels: Record<string, string> = {
  yangi_lid: "Yangi", boglanildi: "Bog'lanildi", qiziqish_bildirdi: "Qiziqish",
  taklif_yuborildi: "Taklif", muzokara: "Muzokara", golib: "G'olib", yutqazilgan: "Yo'qotilgan",
};

const statusColors: Record<string, string> = {
  keldi: "bg-emerald-100 text-emerald-700",
  kechikdi: "bg-amber-100 text-amber-700",
  kelmadi: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  keldi: "Keldi", kechikdi: "Kechikdi", kelmadi: "Kelmadi",
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTimeout(() => setLoading(false), 300);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" />
          <p className="text-sm text-black/30">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-center text-red-500 py-20">Ma'lumot yuklashda xatolik</p>;

  const openLeads = data.leadsByStage
    .filter((l) => l.stage !== "golib" && l.stage !== "yutqazilgan")
    .reduce((s, l) => s + Number(l.count), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="apple-page-header">
        <h1>Boshqaruv paneli</h1>
        <p>{new Date().toLocaleDateString("uz-UZ", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <StatCard label="Jami xodimlar" value={data.totalEmployees} color="#0071e3" />
        <StatCard label="Bugun keldi" value={data.todayPresent} color="#34c759" />
        <StatCard label="Kechikdi" value={data.todayLate} color="#ff9f0a" />
        <StatCard label="Kelmadi" value={data.todayAbsent} color="#ff3b30" />
        <StatCard label="Faol vazifalar" value={data.activeTasks} color="#5e5ce6" />
        <StatCard label="Kutilayotgan hisobot" value={data.pendingReports} color="#ff9500" />
        <StatCard label="SLA buzilgan" value={data.slaBreached} color="#ff3b30" />
      </div>

      {/* CRM Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider">Ochiq lidlar</p>
          <p className="text-3xl font-bold mt-1 tracking-tight">{openLeads}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {data.leadsByStage.filter((l) => l.stage !== "golib" && l.stage !== "yutqazilgan").map((l) => (
              <span key={l.stage} className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-black/5 text-black/60">
                {stageLabels[l.stage]}: {l.count}
              </span>
            ))}
          </div>
        </div>
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider">Bu oy g&apos;olib bitimlar</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold tracking-tight">{data.wonDealsCount}</p>
            <span className="text-sm text-black/30">ta</span>
          </div>
          <p className="text-lg font-semibold text-[#34c759] mt-1">{(data.wonDealsTotal / 1_000_000).toFixed(1)} mln so&apos;m</p>
        </div>
        <div className="apple-card p-5">
          <p className="text-xs font-medium text-black/40 uppercase tracking-wider">Konversiya</p>
          <p className="text-3xl font-bold mt-1 tracking-tight apple-gradient">{data.conversionRate}%</p>
          <p className="text-xs text-black/30 mt-1">Lid → g&apos;olib</p>
          <div className="apple-progress mt-3">
            <div className="apple-progress-bar" style={{ width: `${data.conversionRate}%` }} />
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Attendance Trend */}
        <div className="apple-card p-6">
          <h2 className="text-sm font-semibold mb-5">7 kunlik davomat trendi</h2>
          <div className="flex items-end gap-2 h-40">
            {data.attendanceTrend.map((day, i) => {
              const max = Math.max(day.present, day.late, day.absent, 1);
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col-reverse gap-0.5 rounded-t overflow-hidden" style={{ height: `${(Math.max(day.present, day.late, day.absent) / max) * 140}px` }}>
                    {day.absent > 0 && <div className="bg-red-400 w-full transition-all" style={{ height: `${(day.absent / Math.max(day.present, day.late, day.absent, 1)) * 100}%` }} />}
                    {day.late > 0 && <div className="bg-amber-400 w-full transition-all" style={{ height: `${(day.late / Math.max(day.present, day.late, day.absent, 1)) * 100}%` }} />}
                    {day.present > 0 && <div className="bg-emerald-500 w-full transition-all" style={{ height: `${(day.present / Math.max(day.present, day.late, day.absent, 1)) * 100}%` }} />}
                  </div>
                  <span className="text-[10px] text-black/30 font-medium">
                    {new Date(day.date).toLocaleDateString("uz-UZ", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 mt-4 text-xs text-black/40">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Keldi</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Kechikdi</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Kelmadi</span>
          </div>
        </div>

        {/* Top Employees */}
        <div className="apple-card p-6">
          <h2 className="text-sm font-semibold mb-5">Top-5 xodim KPI reytingi</h2>
          <div className="space-y-4">
            {data.topEmployees.map((emp, idx) => {
              const kpi = emp.kpi ?? 0;
              const pct = Math.min((kpi / 1_000_000) * 100, 100);
              const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
              return (
                <div key={emp.id} className="flex items-center gap-3">
                  <span className="text-base w-6 text-center">{medals[idx]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-black/80 truncate">{emp.firstName} {emp.lastName}</span>
                      <span className="text-[11px] font-semibold text-black/40">{(kpi / 1_000_000).toFixed(1)}M</span>
                    </div>
                    <div className="apple-progress">
                      <div className="apple-progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap">
                    {kpi > 800000 ? "🏆 Rag'bat" : kpi > 500000 ? "👍 Yaxshi" : "📈 O'sish"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Today Attendance */}
        <div className="apple-card p-6">
          <h2 className="text-sm font-semibold mb-4">Bugungi davomat</h2>
          <table className="apple-table">
            <thead>
              <tr>
                <th>Xodim</th>
                <th>Keldi</th>
                <th>Ketdi</th>
                <th>Holat</th>
              </tr>
            </thead>
            <tbody>
              {data.todayAttendance.slice(0, 6).map((att) => (
                <tr key={att.id}>
                  <td className="font-medium text-black/80">{att.firstName} {att.lastName}</td>
                  <td className="text-black/50">{att.checkIn ? new Date(att.checkIn).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td className="text-black/50">{att.checkOut ? new Date(att.checkOut).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td><span className={`apple-badge ${statusColors[att.status] || "bg-black/5 text-black/50"}`}>{statusLabels[att.status] || att.status}</span></td>
                </tr>
              ))}
              {data.todayAttendance.length === 0 && (
                <tr><td colSpan={4} className="text-center text-black/30 py-6 text-sm">Bugun davomat ma'lumoti yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Recent Activities */}
        <div className="apple-card p-6">
          <h2 className="text-sm font-semibold mb-4">So&apos;nggi faoliyatlar</h2>
          <div className="space-y-3">
            {data.recentActivities.slice(0, 8).map((act, i) => (
              <div key={act.id} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#0071e3]/40 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-black/70 truncate">{act.action}</p>
                  <p className="text-[11px] text-black/30 mt-0.5">
                    {act.firstName && `${act.firstName} ${act.lastName} • `}
                    {new Date(act.createdAt).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="apple-card p-4">
      <p className="text-[11px] font-medium text-black/40 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold mt-0.5 tracking-tight" style={{ color }}>{value}</p>
    </div>
  );
}
