"use client";

import { useEffect, useState } from "react";

interface Employee {
  id: number; firstName: string; lastName: string;
  email: string | null; phone: string | null;
  positionName: string | null; status: string; role: string;
  address: string | null; education: string | null;
  cardNumber: string | null; telegramLogin: string | null;
}

interface Position { id: number; name: string; baseSalary: number; salaryType: string; }

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "",
    education: "", cardNumber: "", telegramLogin: "", telegramPassword: "",
    positionId: 0, status: "ishlaydi", role: "employee",
  });

  const fetchEmployees = () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    fetch(`/api/users?${params}`).then((r) => r.json()).then(setEmployees).finally(() => setLoading(false));
  };

  useEffect(() => { fetch("/api/positions").then((r) => r.json()).then(setPositions); }, []);
  useEffect(() => { fetchEmployees(); }, [statusFilter, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const method = editing ? "PUT" : "POST";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowForm(false); setEditing(null);
    setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", education: "", cardNumber: "", telegramLogin: "", telegramPassword: "", positionId: 0, status: "ishlaydi", role: "employee" });
    fetchEmployees();
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      firstName: emp.firstName, lastName: emp.lastName, email: emp.email || "", phone: emp.phone || "",
      address: emp.address || "", education: emp.education || "", cardNumber: emp.cardNumber || "",
      telegramLogin: emp.telegramLogin || "", telegramPassword: "",
      positionId: positions.find((p) => p.name === emp.positionName)?.id || 0,
      status: emp.status, role: emp.role,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    fetchEmployees();
  };

  const exportCSV = () => {
    const headers = ["Ism", "Familiya", "Lavozim", "Email", "Telefon", "Holat"];
    const rows = employees.map((e) => [e.firstName, e.lastName, e.positionName || "", e.email || "", e.phone || "", e.status]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "xodimlar.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header">
        <div><h1>Xodimlar</h1><p>Barcha xodimlar ro'yxati va boshqaruvi</p></div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="apple-btn apple-btn-secondary text-xs">📥 Eksport</button>
          <button onClick={() => { setEditing(null); setForm({ firstName: "", lastName: "", email: "", phone: "", address: "", education: "", cardNumber: "", telegramLogin: "", telegramPassword: "", positionId: 0, status: "ishlaydi", role: "employee" }); setShowForm(true); }} className="apple-btn text-xs">+ Xodim qo'shish</button>
        </div>
      </div>

      <div className="flex gap-3">
        <input type="text" placeholder="Qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="apple-input w-64" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="apple-input">
          <option value="">Barcha holat</option>
          <option value="ishlaydi">Ishlaydi</option>
          <option value="ishdan_ketgan">Ishdan ketgan</option>
          <option value="damda">Damda</option>
        </select>
      </div>

      <div className="apple-card overflow-hidden">
        <table className="apple-table">
          <thead>
            <tr><th>Xodim</th><th>Lavozim</th><th>Telefon</th><th>Email</th><th>Holat</th><th>Rol</th><th></th></tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="font-medium text-black/80">{emp.firstName} {emp.lastName}</td>
                <td className="text-black/50">{emp.positionName || "—"}</td>
                <td className="text-black/50">{emp.phone || "—"}</td>
                <td className="text-black/50">{emp.email || "—"}</td>
                <td>
                  <span className={`apple-badge ${
                    emp.status === "ishlaydi" ? "bg-emerald-100 text-emerald-700" :
                    emp.status === "damda" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {emp.status === "ishlaydi" ? "Ishlaydi" : emp.status === "damda" ? "Damda" : "Ketgan"}
                  </span>
                </td>
                <td className="text-[11px] text-black/40 capitalize">{emp.role}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(emp)} className="text-sm text-black/40 hover:text-[#0071e3] transition-colors">✏️</button>
                    <button onClick={() => handleDelete(emp.id)} className="text-sm text-black/40 hover:text-red-500 transition-colors">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay" onClick={() => setShowForm(false)}>
          <div className="apple-modal w-full max-w-xl max-h-[85vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">{editing ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-1"><label className="block text-xs font-medium text-black/50 mb-1.5">Ism</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="apple-input w-full" /></div>
              <div className="col-span-1"><label className="block text-xs font-medium text-black/50 mb-1.5">Familiya</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Telefon</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Manzil</label><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Ta'lim</label><input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Karta raqami</label><input value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} className="apple-input w-full" /></div>
              <div><label className="block text-xs font-medium text-black/50 mb-1.5">Telegram login</label><input value={form.telegramLogin} onChange={(e) => setForm({ ...form, telegramLogin: e.target.value })} className="apple-input w-full" /></div>
              <div>
                <label className="block text-xs font-medium text-black/50 mb-1.5">Lavozim</label>
                <select value={form.positionId} onChange={(e) => setForm({ ...form, positionId: Number(e.target.value) })} className="apple-input w-full" required>
                  <option value={0}>Tanlang...</option>
                  {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 col-span-2">
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1.5">Holat</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="apple-input w-full">
                    <option value="ishlaydi">Ishlaydi</option>
                    <option value="ishdan_ketgan">Ishdan ketgan</option>
                    <option value="damda">Damda</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-black/50 mb-1.5">Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="apple-input w-full">
                    <option value="admin">Admin</option>
                    <option value="manager">Menejer</option>
                    <option value="employee">Xodim</option>
                  </select>
                </div>
              </div>
              <div className="col-span-2 flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor qilish</button>
                <button type="submit" className="apple-btn">{editing ? "Saqlash" : "Qo'shish"}</button>
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
