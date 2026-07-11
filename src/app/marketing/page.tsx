"use client";
import { useEffect, useState } from "react";
interface MarketingRule { id: number; name: string; triggerEvent: string; action: string; config: string | null; enabled: boolean; }

export default function MarketingPage() {
  const [rules, setRules] = useState<MarketingRule[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/marketing").then((r) => r.json()).then(setRules).finally(() => setLoading(false)); }, []);

  const toggleRule = async (rule: MarketingRule) => { await fetch("/api/marketing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }) }); setRules(rules.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))); };

  if (loading) return <Loading />;
  const triggerLabels: Record<string, string> = { new_lead: "🆕 Yangi lid", inactive_lead: "⏰ Harakatsiz lid", deal_won: "🏆 Bitim g'olib" };
  const actionLabels: Record<string, string> = { send_greeting: "📨 Salomlashish", notify_manager: "🔔 Menejerga eslatma", send_confirmation: "✅ Tasdiqlash" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Marketing avtomatizatsiyasi</h1><p>Avtomatik harakatlar va bildirishnomalar</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rules.map((rule) => {
          const config = rule.config ? JSON.parse(rule.config) : {};
          return (
            <div key={rule.id} className={`apple-card p-6 ${!rule.enabled ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-black/90">{rule.name}</h3>
                <button onClick={() => toggleRule(rule)} className={`relative w-11 h-6 rounded-full transition-colors ${rule.enabled ? "bg-[#34c759]" : "bg-black/20"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${rule.enabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm text-black/60">
                <p>⚡ <strong className="text-black/80">{triggerLabels[rule.triggerEvent] || rule.triggerEvent}</strong></p>
                <p>🎯 <strong className="text-black/80">{actionLabels[rule.action] || rule.action}</strong></p>
                {config.message && <p className="text-xs bg-black/[0.02] p-2.5 rounded-xl mt-2">💬 &ldquo;{config.message}&rdquo;</p>}
                {config.days && <p className="text-xs text-black/40 mt-1">⏰ {config.days} kundan keyin</p>}
              </div>
            </div>
          );
        })}
      </div>
      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-3">Marketing statistikasi</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-emerald-50 rounded-2xl"><p className="text-2xl font-bold text-emerald-700">{rules.filter((r) => r.enabled).length}</p><p className="text-xs text-emerald-600 mt-0.5">Faol qoidalar</p></div>
          <div className="p-4 bg-blue-50 rounded-2xl"><p className="text-2xl font-bold text-blue-700">7</p><p className="text-xs text-blue-600 mt-0.5">Yangi lidlar (hafta)</p></div>
          <div className="p-4 bg-purple-50 rounded-2xl"><p className="text-2xl font-bold text-purple-700">2</p><p className="text-xs text-purple-600 mt-0.5">G'olib bitimlar</p></div>
        </div>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
