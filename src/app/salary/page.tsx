"use client";
import { useEffect, useState } from "react";
interface Salary { id: number; userId: number; month: string; baseSalary: number; bonus: number; kpiBonus: number; fine: number; total: number; cardNumber: string | null; paidAt: string | null; firstName: string; lastName: string; }

export default function SalaryPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState("2026-01");
  useEffect(() => { fetch(`/api/salary?month=${month}`).then((r) => r.json()).then(setSalaries).finally(() => setLoading(false)); }, [month]);
  if (loading) return <Loading />;
  const totalSalaries = salaries.reduce((s, r) => s + r.total, 0);
  const totalBonuses = salaries.reduce((s, r) => s + r.bonus + r.kpiBonus, 0);
  const totalFines = salaries.reduce((s, r) => s + r.fine, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Oylik tarqatish</h1><p>Xodimlar oylik maosh hisoboti</p></div>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="apple-input w-36" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="apple-card p-4"><p className="apple-stat-label">Jami oylik fond</p><p className="apple-stat-value text-[#0071e3]">{(totalSalaries / 1_000_000).toFixed(1)} mln</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Bonus/KPI</p><p className="apple-stat-value text-emerald-600">{(totalBonuses / 1_000_000).toFixed(1)} mln</p></div>
        <div className="apple-card p-4"><p className="apple-stat-label">Jarimalar</p><p className="apple-stat-value text-red-600">{(totalFines / 1_000_000).toFixed(1)} mln</p></div>
      </div>
      <div className="apple-card overflow-hidden">
        <table className="apple-table">
          <thead><tr><th>Xodim</th><th>Karta</th><th className="text-right">Maosh</th><th className="text-right">Bonus</th><th className="text-right">KPI</th><th className="text-right">Jarima</th><th className="text-right font-semibold">Jami</th></tr></thead>
          <tbody>{salaries.map((s) => (
            <tr key={s.id}>
              <td className="font-medium text-black/80">{s.firstName} {s.lastName}</td>
              <td className="text-[11px] text-black/30">{s.cardNumber || "—"}</td>
              <td className="text-right text-black/60">{(s.baseSalary / 1_000_000).toFixed(2)}</td>
              <td className="text-right text-emerald-600">{(s.bonus / 1_000_000).toFixed(2)}</td>
              <td className="text-right text-blue-600">{(s.kpiBonus / 1_000_000).toFixed(2)}</td>
              <td className="text-right text-red-600">{(s.fine / 1_000_000).toFixed(2)}</td>
              <td className="text-right font-bold text-black/90">{(s.total / 1_000_000).toFixed(2)} mln</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
