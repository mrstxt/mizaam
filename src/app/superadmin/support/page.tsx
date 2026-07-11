"use client";

import { useEffect, useState } from "react";

interface SupportTicket {
  id: number;
  userId: number;
  subject: string;
  message: string;
  status: string;
  response: string | null;
  createdAt: string;
  firstName: string;
  lastName: string;
}

export default function SuperAdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const fetchTickets = () => {
    fetch("/api/support")
      .then((r) => r.json())
      .then(setTickets)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const respond = async (id: number) => {
    if (!responseText.trim()) return;
    await fetch("/api/support", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "jarayonda", response: responseText }),
    });
    setResponding(null);
    setResponseText("");
    fetchTickets();
  };

  const resolve = async (id: number) => {
    await fetch("/api/support", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "hal_qilindi" }),
    });
    fetchTickets();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const openCount = tickets.filter((t) => t.status === "ochiq").length;
  const inProgressCount = tickets.filter((t) => t.status === "jarayonda").length;
  const resolvedCount = tickets.filter((t) => t.status === "hal_qilindi").length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-black/90">🛟 Global Support Core (Mizaam Helpdesk)</h1>
          <p className="text-sm text-black/50 mt-1">
            Barcha mijoz korxonalardan kelib tushgan texnik va huquqiy yordam murojaatlari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="apple-badge bg-red-100 text-red-700 px-3 py-1">Ochiq: {openCount}</span>
          <span className="apple-badge bg-amber-100 text-amber-700 px-3 py-1">Jarayonda: {inProgressCount}</span>
          <span className="apple-badge bg-emerald-100 text-emerald-700 px-3 py-1">Hal qilindi: {resolvedCount}</span>
        </div>
      </div>

      <div className="space-y-4">
        {tickets.map((t) => (
          <div key={t.id} className="apple-card p-6 border-l-4 border-l-[#0071e3]">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-base text-black/90">{t.subject}</span>
                  <span
                    className={`apple-badge ${
                      t.status === "ochiq"
                        ? "bg-red-100 text-red-700"
                        : t.status === "jarayonda"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {t.status === "ochiq" ? "Ochiq (Open)" : t.status === "jarayonda" ? "Jarayonda" : "Hal qilindi (Resolved)"}
                  </span>
                </div>

                <p className="text-sm text-black/80 mt-2.5 leading-relaxed bg-black/[0.02] p-3.5 rounded-xl border border-black/[0.04]">
                  {t.message}
                </p>

                <p className="text-xs text-black/40 mt-2 font-medium">
                  Mijoz: <strong className="text-black/70">{t.firstName} {t.lastName}</strong> •{" "}
                  {new Date(t.createdAt).toLocaleString("uz-UZ", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>

                {t.response && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
                    <p className="text-[11px] text-amber-900 font-bold uppercase tracking-wider mb-1">
                      ⚡ Mizaam Core Engine Javobi:
                    </p>
                    <p className="text-sm text-black/80 font-medium">{t.response}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                {t.status === "ochiq" && (
                  <button
                    onClick={() => {
                      setResponding(t.id);
                      setResponseText(t.response || "");
                    }}
                    className="apple-btn text-xs bg-blue-600 hover:bg-blue-700 px-4 py-2"
                  >
                    Javob berish
                  </button>
                )}
                {t.status === "jarayonda" && (
                  <>
                    <button
                      onClick={() => {
                        setResponding(t.id);
                        setResponseText(t.response || "");
                      }}
                      className="apple-btn apple-btn-secondary text-xs px-3 py-2"
                    >
                      Tahrirlash
                    </button>
                    <button
                      onClick={() => resolve(t.id)}
                      className="apple-btn text-xs bg-emerald-600 hover:bg-emerald-700 px-4 py-2"
                    >
                      ✓ Hal qilindi
                    </button>
                  </>
                )}
                {t.status === "hal_qilindi" && (
                  <button
                    onClick={() => {
                      setResponding(t.id);
                      setResponseText(t.response || "");
                    }}
                    className="apple-btn apple-btn-secondary text-xs px-3 py-2"
                  >
                    Qayta ochish
                  </button>
                )}
              </div>
            </div>

            {responding === t.id && (
              <div className="mt-4 p-4 bg-black/[0.03] rounded-xl border border-black/10 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-black/60">
                  Mijozga rasmiy javob yuborish
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                  placeholder="Mizaam texnik yordam bo'limi nomidan javob yozing..."
                  className="apple-input w-full text-sm font-medium"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => setResponding(null)}
                    className="apple-btn apple-btn-secondary text-xs px-4 py-2"
                  >
                    Bekor
                  </button>
                  <button
                    onClick={() => respond(t.id)}
                    className="apple-btn bg-gradient-to-r from-amber-500 to-orange-500 text-xs px-5 py-2 font-bold shadow-sm"
                  >
                    ⚡ Javobni yuborish
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {tickets.length === 0 && (
          <p className="text-center py-14 text-black/30">Murojaatlar mavjud emas</p>
        )}
      </div>
    </div>
  );
}
