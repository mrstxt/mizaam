"use client";
import { useEffect, useState } from "react";
interface Rule { id: number; name: string; ruleType: string; value: number; description: string | null; workStartTime: string | null; workEndTime: string | null; gracePeriodMinutes: number | null; warningLimit: number | null; attendanceFine: number | null; taskDelayFine: number | null; kpiMax: number | null; earlyBonus: number | null; }

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/rules").then((r) => r.json()).then(setRules).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Qoidalar</h1><p>Korxona ichki qoidalari va jarimalar tizimi</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="apple-card p-6">
            <h3 className="font-semibold text-black/90">{rule.name}</h3>
            <p className="text-sm text-black/40 mt-1">{rule.description}</p>
            <div className="mt-4 space-y-1.5 text-sm text-black/60">
              {rule.ruleType === "late_fine" && (<>
                <p>⏰ Ish vaqti: <strong className="text-black/80">{rule.workStartTime} – {rule.workEndTime}</strong></p>
                <p>⏳ Jarimasiz: <strong className="text-black/80">{rule.gracePeriodMinutes} daqiqa</strong></p>
                <p>⚠️ Ogohlantirish: <strong className="text-black/80">{rule.warningLimit} marta</strong></p>
                <p>💰 Jarima: <strong className="text-black/80">{(rule.attendanceFine || 0).toLocaleString()} so'm</strong></p>
              </>)}
              {rule.ruleType === "task_delay_fine" && <p>💰 Vazifa kechiktirish: <strong className="text-black/80">{(rule.taskDelayFine || 0).toLocaleString()} so'm</strong></p>}
              {rule.ruleType === "kpi_max" && <p>📊 Maksimal KPI: <strong className="text-black/80">{rule.kpiMax}%</strong></p>}
              {rule.ruleType === "early_bonus" && <p>🎁 Erta tugatish bonusi: <strong className="text-black/80">{(rule.earlyBonus || 0).toLocaleString()} so'm</strong></p>}
            </div>
          </div>
        ))}
      </div>
      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-3">Korxona ichki qoidalari</h2>
        <textarea className="apple-input w-full" rows={6} placeholder="Ichki qoidalarni yozing..." defaultValue={`1. Ish vaqti: 09:00 - 18:00\n2. Tushlik: 13:00 - 14:00\n3. Kechikish uchun jarima: 50,000 so'm\n4. Har kuni kunlik hisobot topshirish majburiy\n5. Vazifa muddatini buzish - 100,000 so'm jarima`} />
        <div className="flex gap-2 mt-3"><button className="apple-btn text-xs">💾 Saqlash</button><button className="apple-btn apple-btn-secondary text-xs">📎 Fayl yuklash</button></div>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
