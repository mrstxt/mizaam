"use client";

import { useEffect, useState } from "react";

interface Task {
  id: number; title: string; description: string | null; assignedTo: number;
  priority: string; status: string; deadline: string | null; bonus: number;
  assigneeFirstName: string; assigneeLastName: string;
}
interface Employee { id: number; firstName: string; lastName: string; }

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", assignedTo: 0, priority: "orta", status: "kutilmoqda", deadline: "", bonus: 0 });

  const fetchTasks = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/tasks?${params}`).then((r) => r.json()).then(setTasks).finally(() => setLoading(false));
  };

  useEffect(() => { fetch("/api/users?status=ishlaydi").then((r) => r.json()).then(setEmployees); }, []);
  useEffect(() => { fetchTasks(); }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, createdBy: 1 }) });
    setShowForm(false);
    setForm({ title: "", description: "", assignedTo: 0, priority: "orta", status: "kutilmoqda", deadline: "", bonus: 0 });
    fetchTasks();
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch(`/api/tasks/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, completedAt: status === "bajarildi" ? new Date().toISOString() : null }) });
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  if (loading) return <Loading />;

  const priorityStyles: Record<string, string> = { past: "bg-black/5 text-black/50", orta: "bg-blue-100 text-blue-700", yuqori: "bg-orange-100 text-orange-700", kritik: "bg-red-100 text-red-700" };
  const priorityLabels: Record<string, string> = { past: "Past", orta: "O'rta", yuqori: "Yuqori", kritik: "Kritik" };
  const statusStyles: Record<string, string> = { kutilmoqda: "bg-amber-100 text-amber-700", bajarilmoqda: "bg-blue-100 text-blue-700", bajarildi: "bg-emerald-100 text-emerald-700", muddati_otgan: "bg-red-100 text-red-700" };
  const statusLabels: Record<string, string> = { kutilmoqda: "Kutilmoqda", bajarilmoqda: "Bajarilmoqda", bajarildi: "Bajarildi", muddati_otgan: "Muddati o'tgan" };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Vazifalar</h1><p>Xodimlar vazifalari boshqaruvi</p></div>
        <button onClick={() => setShowForm(true)} className="apple-btn text-xs">+ Vazifa qo'shish</button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="apple-input w-44">
          <option value="">Barcha holat</option>
          <option value="kutilmoqda">Kutilmoqda</option>
          <option value="bajarilmoqda">Bajarilmoqda</option>
          <option value="bajarildi">Bajarildi</option>
          <option value="muddati_otgan">Muddati o'tgan</option>
        </select>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="apple-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`apple-badge ${priorityStyles[task.priority] || ""}`}>{priorityLabels[task.priority] || task.priority}</span>
                  <span className={`apple-badge ${statusStyles[task.status] || ""}`}>{statusLabels[task.status] || task.status}</span>
                </div>
                <h3 className="text-base font-semibold text-black/90 mt-2">{task.title}</h3>
                {task.description && <p className="text-sm text-black/50 mt-1">{task.description}</p>}
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-black/40">
                  <span>👤 {task.assigneeFirstName} {task.assigneeLastName}</span>
                  <span>📅 {task.deadline ? new Date(task.deadline).toLocaleDateString("uz-UZ") : "—"}</span>
                  <span>💰 {(task.bonus || 0).toLocaleString()} so'm</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {task.status === "kutilmoqda" && <button onClick={() => updateStatus(task.id, "bajarilmoqda")} className="apple-btn text-[11px] px-3 py-1.5 bg-blue-500 hover:bg-blue-600 min-w-0">Boshlash</button>}
                {task.status === "bajarilmoqda" && <button onClick={() => updateStatus(task.id, "bajarildi")} className="apple-btn text-[11px] px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 min-w-0">Bajarildi</button>}
                <button onClick={() => deleteTask(task.id)} className="text-sm text-black/30 hover:text-red-500 transition-colors">🗑️</button>
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-center text-black/30 py-12 text-sm">Vazifalar topilmadi</p>}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="apple-modal w-full max-w-lg p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Yangi vazifa</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Sarlavha</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Tavsif</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="apple-input w-full" rows={3} /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Xodim</label>
                <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: Number(e.target.value) })} required className="apple-input w-full">
                  <option value={0}>Tanlang...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-black/50 mb-1.5">Muhimlik</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="apple-input w-full">
                    <option value="past">Past</option><option value="orta">O'rta</option><option value="yuqori">Yuqori</option><option value="kritik">Kritik</option>
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-black/50 mb-1.5">Bonus</label><input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })} className="apple-input w-full" /></div>
              </div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Muddat</label><input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="apple-input w-full" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor qilish</button>
                <button type="submit" className="apple-btn">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>;
}
