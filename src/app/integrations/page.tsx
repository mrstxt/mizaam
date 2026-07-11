"use client";
import { useEffect, useState } from "react";
interface Integration { id: number; name: string; type: string; config: string | null; enabled: boolean; }

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/integrations").then((r) => r.json()).then(setIntegrations).finally(() => setLoading(false)); }, []);

  const toggleIntegration = async (integration: Integration) => { await fetch("/api/integrations", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: integration.id, enabled: !integration.enabled }) }); setIntegrations(integrations.map((i) => (i.id === integration.id ? { ...i, enabled: !i.enabled } : i))); };

  if (loading) return <Loading />;
  const typeIcons: Record<string, string> = { telegram: "📱", website: "🌐", whatsapp: "💬", instagram: "📷", facebook: "📘" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Integratsiyalar</h1><p>Lid manbalari va tashqi xizmatlar ulanishi</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {integrations.map((integration) => {
          const config = integration.config ? JSON.parse(integration.config) : {};
          return (
            <div key={integration.id} className={`apple-card p-6 ${!integration.enabled ? "opacity-50" : ""}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{typeIcons[integration.type] || "🔌"}</span>
                <div className="flex-1"><h3 className="font-semibold text-black/90">{integration.name}</h3><p className="text-xs text-black/40 capitalize">{integration.type}</p></div>
                <button onClick={() => toggleIntegration(integration)} className={`relative w-11 h-6 rounded-full transition-colors ${integration.enabled ? "bg-[#34c759]" : "bg-black/20"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${integration.enabled ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
              <div className="mt-3 p-3 bg-black/[0.02] rounded-xl text-xs text-black/50 font-mono">
                {Object.entries(config).map(([key, val]) => <p key={key}><strong>{key}:</strong> {String(val)}</p>)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-3">Yangi integratsiya qo'shish</h2>
        <p className="text-sm text-black/40 mb-4">Qo'shimcha integratsiyalar (WhatsApp Business, Instagram, Facebook) uchun API kalitlari kerak. Keyingi versiyalarda qo'shiladi.</p>
        <div className="flex gap-2">
          <button className="apple-btn apple-btn-secondary text-xs opacity-50 cursor-not-allowed" disabled>WhatsApp ulash</button>
          <button className="apple-btn apple-btn-secondary text-xs opacity-50 cursor-not-allowed" disabled>Instagram ulash</button>
          <button className="apple-btn apple-btn-secondary text-xs opacity-50 cursor-not-allowed" disabled>Facebook ulash</button>
        </div>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
