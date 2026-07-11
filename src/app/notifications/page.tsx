"use client";
import { useEffect, useState } from "react";
interface Notification { id: number; title: string; message: string; type: string; status: string; scheduledFor: string | null; sentAt: string | null; targetUserId: number | null; targetRole: string | null; createdAt: string; }

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/notifications").then((r) => r.json()).then(setNotifications).finally(() => setLoading(false)); }, []);
  if (loading) return <Loading />;

  const pending = notifications.filter((n) => n.status === "kutilmoqda");
  const scheduled = notifications.filter((n) => n.status === "rejalashtirilgan");
  const sent = notifications.filter((n) => n.status === "yuborildi");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="apple-page-header"><h1>Bildirishnomalar</h1><p>Xabar va ogohlantirishlar boshqaruvi</p></div>

      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Hozir yuborish kerak ({pending.length})</h2>
        <div className="space-y-2">
          {pending.map((n) => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
              <div><p className="font-medium text-sm text-amber-900">{n.title}</p><p className="text-xs text-amber-700">{n.message}</p></div>
              <span className={`apple-badge ${n.type === "signal" ? "bg-red-100 text-red-700" : n.type === "ogohlantirish" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{n.type === "signal" ? "Signal" : n.type === "ogohlantirish" ? "Ogohlantirish" : "Info"}</span>
            </div>
          ))}
          {pending.length === 0 && <p className="text-sm text-black/30 py-4 text-center">Yuborilishi kerak bo'lgan bildirishnomalar yo'q</p>}
        </div>
      </div>

      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" /> Rejalashtirilgan ({scheduled.length})</h2>
        <div className="space-y-2">
          {scheduled.map((n) => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div><p className="font-medium text-sm text-blue-900">{n.title}</p><p className="text-xs text-blue-700">{n.message}</p></div>
              <span className="text-xs text-black/40">{n.scheduledFor ? new Date(n.scheduledFor).toLocaleString("uz-UZ") : "—"}</span>
            </div>
          ))}
          {scheduled.length === 0 && <p className="text-sm text-black/30 py-4 text-center">Rejalashtirilgan bildirishnomalar yo'q</p>}
        </div>
      </div>

      <div className="apple-card p-6">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Yuborilgan ({sent.length})</h2>
        <div className="space-y-2">
          {sent.slice(0, 10).map((n) => (
            <div key={n.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl">
              <div><p className="font-medium text-sm text-emerald-900">{n.title}</p><p className="text-xs text-emerald-700">{n.message}</p></div>
              <span className="text-xs text-black/40">{n.sentAt ? new Date(n.sentAt).toLocaleString("uz-UZ") : "—"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Loading() { return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>; }
