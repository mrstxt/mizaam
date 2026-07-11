"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PANELS_BY_ROLE,
  PANEL_DEFINITIONS,
  ROLE_LABELS,
  type PanelKey,
  type UserRole,
} from "@/lib/permissions";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  positionId: number | null;
  positionName: string | null;
  status: string;
  role: UserRole;
  address: string | null;
  education: string | null;
  cardNumber: string | null;
  telegramLogin: string | null;
  login: string | null;
  panelAccess: string | null;
  panels: PanelKey[];
  lastLoginAt: string | null;
  mustChangePassword: boolean | null;
}

interface Position { id: number; name: string; baseSalary: number; salaryType: string; }
interface SessionUser { id: number; role: UserRole; panels: PanelKey[]; }

type EmployeeForm = {
  firstName: string;
  lastName: string;
  login: string;
  password: string;
  email: string;
  phone: string;
  address: string;
  education: string;
  cardNumber: string;
  telegramLogin: string;
  telegramPassword: string;
  positionId: number;
  status: "ishlaydi" | "ishdan_ketgan" | "damda";
  role: UserRole;
  panelAccess: PanelKey[];
  mustChangePassword: boolean;
};

const roleDescriptions: Record<UserRole, string> = {
  admin: "Barcha panellar, HR yaratish va tizim sozlamalari",
  manager: "HR panel: xodimlar, davomat, vazifalar va hisobotlar",
  employee: "Xodim panel: o'z vazifalari, hisobotlari va chat",
};

const emptyForm = (role: UserRole = "employee"): EmployeeForm => ({
  firstName: "",
  lastName: "",
  login: "",
  password: "",
  email: "",
  phone: "",
  address: "",
  education: "",
  cardNumber: "",
  telegramLogin: "",
  telegramPassword: "",
  positionId: 0,
  status: "ishlaydi",
  role,
  panelAccess: DEFAULT_PANELS_BY_ROLE[role],
  mustChangePassword: false,
});

function csvEscape(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [session, setSession] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreatePrivileged = session?.role === "admin";
  const roleOptions: UserRole[] = canCreatePrivileged ? ["admin", "manager", "employee"] : ["employee"];

  const fetchEmployees = async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    const response = await fetch(`/api/users?${params}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Xodimlarni yuklab bo'lmadi");
    setEmployees(data);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/positions").then((r) => r.json()),
    ])
      .then(([me, pos]) => {
        setSession(me.user);
        setPositions(Array.isArray(pos) ? pos : []);
      })
      .then(fetchEmployees)
      .catch((err) => setError(err.message || "Ma'lumot yuklashda xatolik"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchEmployees().catch((err) => setError(err.message || "Xodimlarni yuklab bo'lmadi"));
    }
  }, [statusFilter, search]);

  const visibleEmployees = useMemo(() => {
    return roleFilter ? employees.filter((employee) => employee.role === roleFilter) : employees;
  }, [employees, roleFilter]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((employee) => employee.status === "ishlaydi").length,
      hr: employees.filter((employee) => employee.role === "manager").length,
      withLogin: employees.filter((employee) => Boolean(employee.login)).length,
    };
  }, [employees]);

  const openCreate = () => {
    setEditing(null);
    setError("");
    setSuccess("");
    setForm(emptyForm(canCreatePrivileged ? "employee" : "employee"));
    setShowForm(true);
  };

  const handleEdit = (emp: Employee) => {
    setEditing(emp);
    setError("");
    setSuccess("");
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      login: emp.login || "",
      password: "",
      email: emp.email || "",
      phone: emp.phone || "",
      address: emp.address || "",
      education: emp.education || "",
      cardNumber: emp.cardNumber || "",
      telegramLogin: emp.telegramLogin || "",
      telegramPassword: "",
      positionId: emp.positionId || 0,
      status: emp.status as EmployeeForm["status"],
      role: emp.role,
      panelAccess: emp.panels?.length ? emp.panels : DEFAULT_PANELS_BY_ROLE[emp.role],
      mustChangePassword: Boolean(emp.mustChangePassword),
    });
    setShowForm(true);
  };

  const changeRole = (role: UserRole) => {
    setForm((current) => ({
      ...current,
      role,
      panelAccess: DEFAULT_PANELS_BY_ROLE[role],
    }));
  };

  const togglePanel = (panel: PanelKey) => {
    setForm((current) => {
      const hasPanel = current.panelAccess.includes(panel);
      return {
        ...current,
        panelAccess: hasPanel
          ? current.panelAccess.filter((item) => item !== panel)
          : [...current.panelAccess, panel],
      };
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const payload = {
      ...form,
      panelAccess: form.role === "admin" ? DEFAULT_PANELS_BY_ROLE.admin : form.panelAccess,
      positionId: Number(form.positionId),
    };

    try {
      const url = editing ? `/api/users/${editing.id}` : "/api/users";
      const method = editing ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Saqlashda xatolik");

      setShowForm(false);
      setEditing(null);
      setForm(emptyForm());
      setSuccess(editing ? "Xodim ma'lumotlari yangilandi" : `Xodim yaratildi. Login: ${payload.login}`);
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Xodimni deaktiv qilishni tasdiqlaysizmi?")) return;
    const response = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "O'chirishda xatolik");
      return;
    }
    setSuccess("Xodim deaktiv qilindi");
    fetchEmployees().catch(() => undefined);
  };

  const exportCSV = () => {
    const headers = ["Ism", "Familiya", "Login", "Lavozim", "Email", "Telefon", "Holat", "Rol"];
    const rows = visibleEmployees.map((e) => [e.firstName, e.lastName, e.login || "", e.positionName || "", e.email || "", e.phone || "", e.status, ROLE_LABELS[e.role]]);
    const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mizaam-xodimlar.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between apple-page-header gap-4">
        <div>
          <h1>Xodimlar va panel ruxsatlari</h1>
          <p>Login-parol berish, HR/xodim rollari va panel access boshqaruvi</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="apple-btn apple-btn-secondary text-xs">📥 Eksport</button>
          <button onClick={openCreate} className="apple-btn text-xs">+ Xodim qo'shish</button>
        </div>
      </div>

      {(error || success) && (
        <div className={`rounded-2xl px-4 py-3 text-sm border ${error ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat title="Jami xodim" value={stats.total} color="#0071e3" />
        <Stat title="Faol" value={stats.active} color="#34c759" />
        <Stat title="HR foydalanuvchi" value={stats.hr} color="#ff9f0a" />
        <Stat title="Login berilgan" value={stats.withLogin} color="#5e5ce6" />
      </div>

      <div className="apple-card p-4">
        <div className="grid lg:grid-cols-[1fr_auto_auto] gap-3">
          <input type="text" placeholder="Ism, login yoki telefon bo'yicha qidirish..." value={search} onChange={(e) => setSearch(e.target.value)} className="apple-input w-full" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="apple-input min-w-44">
            <option value="">Barcha holat</option>
            <option value="ishlaydi">Ishlaydi</option>
            <option value="ishdan_ketgan">Ishdan ketgan</option>
            <option value="damda">Damda</option>
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="apple-input min-w-44">
            <option value="">Barcha rol</option>
            <option value="admin">Admin</option>
            <option value="manager">HR</option>
            <option value="employee">Xodim</option>
          </select>
        </div>
      </div>

      <div className="apple-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="apple-table min-w-[1100px]">
            <thead>
              <tr>
                <th>Xodim</th><th>Login</th><th>Lavozim</th><th>Aloqa</th><th>Holat</th><th>Rol</th><th>Panellar</th><th>So'nggi kirish</th><th></th>
              </tr>
            </thead>
            <tbody>
              {visibleEmployees.map((emp) => (
                <tr key={emp.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center text-xs font-bold">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <p className="font-medium text-black/85">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[11px] text-black/35">ID: {emp.id}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-xs bg-black/[0.04] px-2 py-1 rounded-lg">{emp.login || "—"}</span></td>
                  <td className="text-black/55">{emp.positionName || "—"}</td>
                  <td className="text-black/50">
                    <div>{emp.phone || "—"}</div>
                    <div className="text-[11px] text-black/35">{emp.email || ""}</div>
                  </td>
                  <td><StatusBadge status={emp.status} /></td>
                  <td><RoleBadge role={emp.role} /></td>
                  <td>
                    <div className="flex flex-wrap gap-1 max-w-[260px]">
                      {(emp.role === "admin" ? ["all"] : emp.panels.slice(0, 4)).map((panel) => (
                        <span key={panel} className="text-[10px] bg-black/[0.04] text-black/50 rounded-full px-2 py-1">{panel === "all" ? "Barchasi" : panel}</span>
                      ))}
                      {emp.role !== "admin" && emp.panels.length > 4 && <span className="text-[10px] text-black/35">+{emp.panels.length - 4}</span>}
                    </div>
                  </td>
                  <td className="text-black/45 text-xs">{emp.lastLoginAt ? new Date(emp.lastLoginAt).toLocaleString("uz-UZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => handleEdit(emp)} className="text-sm text-black/40 hover:text-[#0071e3] transition-colors" title="Tahrirlash">✏️</button>
                      <button onClick={() => handleDelete(emp.id)} className="text-sm text-black/40 hover:text-red-500 transition-colors" title="Deaktiv qilish">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {visibleEmployees.length === 0 && (
                <tr><td colSpan={9} className="text-center text-black/30 py-12">Xodim topilmadi</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center apple-modal-overlay p-4" onClick={() => !saving && setShowForm(false)}>
          <div className="apple-modal w-full max-w-5xl max-h-[92vh] overflow-y-auto p-6 lg:p-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{editing ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}</h2>
                <p className="text-sm text-black/45 mt-1">Login/parol, rol va panel ruxsatlarini shu yerdan belgilang.</p>
              </div>
              <button type="button" onClick={() => !saving && setShowForm(false)} className="apple-btn apple-btn-secondary px-4">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-3">
                {roleOptions.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => changeRole(role)}
                    className={`text-left rounded-2xl border p-4 transition-all ${form.role === role ? "border-[#0071e3] bg-[#0071e3]/5 ring-4 ring-[#0071e3]/10" : "border-black/10 bg-white hover:bg-black/[0.02]"}`}
                  >
                    <p className="font-semibold">{ROLE_LABELS[role]}</p>
                    <p className="text-xs text-black/45 mt-1 leading-5">{roleDescriptions[role]}</p>
                  </button>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-black/70">Shaxsiy ma'lumotlar</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Ism"><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required className="apple-input w-full" /></Field>
                    <Field label="Familiya"><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required className="apple-input w-full" /></Field>
                    <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="apple-input w-full" /></Field>
                    <Field label="Telefon"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="apple-input w-full" placeholder="+998..." /></Field>
                    <Field label="Manzil"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="apple-input w-full" /></Field>
                    <Field label="Ta'lim"><input value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} className="apple-input w-full" /></Field>
                    <Field label="Karta raqami"><input value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} className="apple-input w-full" /></Field>
                    <Field label="Telegram login"><input value={form.telegramLogin} onChange={(e) => setForm({ ...form, telegramLogin: e.target.value })} className="apple-input w-full" placeholder="@username" /></Field>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-black/70">Kirish va ish ma'lumotlari</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Login"><input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value.toLowerCase().replace(/\s/g, "") })} required={!editing} className="apple-input w-full font-mono" placeholder="masalan: hr" /></Field>
                    <Field label={editing ? "Yangi parol (ixtiyoriy)" : "Parol"}><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={8} className="apple-input w-full" placeholder="Kamida 8 belgi" /></Field>
                    <Field label="Lavozim">
                      <select value={form.positionId} onChange={(e) => setForm({ ...form, positionId: Number(e.target.value) })} className="apple-input w-full" required>
                        <option value={0}>Tanlang...</option>
                        {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </Field>
                    <Field label="Holat">
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EmployeeForm["status"] })} className="apple-input w-full">
                        <option value="ishlaydi">Ishlaydi</option>
                        <option value="ishdan_ketgan">Ishdan ketgan</option>
                        <option value="damda">Damda</option>
                      </select>
                    </Field>
                    <Field label="Telegram parol (ixtiyoriy)"><input type="password" value={form.telegramPassword} onChange={(e) => setForm({ ...form, telegramPassword: e.target.value })} className="apple-input w-full" /></Field>
                    <label className="flex items-center gap-2 text-sm text-black/60 pt-7">
                      <input type="checkbox" checked={form.mustChangePassword} onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })} />
                      Birinchi kirishda parolni almashtirsin
                    </label>
                  </div>
                </section>
              </div>

              <section className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-black/70">Panel ruxsatlari</h3>
                    <p className="text-xs text-black/40 mt-1">Admin barcha panellarga avtomatik kiradi. HR va xodim uchun kerakli panellarni belgilang.</p>
                  </div>
                  {form.role !== "admin" && (
                    <button type="button" onClick={() => setForm({ ...form, panelAccess: DEFAULT_PANELS_BY_ROLE[form.role] })} className="apple-btn apple-btn-secondary text-xs">Default</button>
                  )}
                </div>
                <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-3 ${form.role === "admin" ? "opacity-60 pointer-events-none" : ""}`}>
                  {PANEL_DEFINITIONS.filter((panel) => form.role === "admin" || panel.key !== "superadmin").map((panel) => (
                    <label key={panel.key} className={`rounded-2xl border p-3 cursor-pointer transition-all ${form.role === "admin" || form.panelAccess.includes(panel.key) ? "border-[#0071e3]/40 bg-[#0071e3]/5" : "border-black/10 bg-white hover:bg-black/[0.02]"}`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" checked={form.role === "admin" || form.panelAccess.includes(panel.key)} onChange={() => togglePanel(panel.key)} disabled={form.role === "admin"} className="mt-1" />
                        <div>
                          <p className="text-sm font-semibold text-black/75">{panel.label}</p>
                          <p className="text-[11px] text-black/40 mt-1 leading-4">{panel.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              <div className="flex gap-3 justify-end border-t border-black/5 pt-5">
                <button type="button" disabled={saving} onClick={() => setShowForm(false)} className="apple-btn apple-btn-secondary">Bekor qilish</button>
                <button type="submit" disabled={saving} className="apple-btn disabled:opacity-60">{saving ? "Saqlanmoqda..." : editing ? "Saqlash" : "Qo'shish"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ title, value, color }: { title: string; value: number; color: string }) {
  return <div className="apple-card p-4"><p className="text-xs font-medium text-black/40 uppercase tracking-wider">{title}</p><p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p></div>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-black/50 mb-1.5">{label}</span>{children}</label>;
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "ishlaydi" ? "bg-emerald-100 text-emerald-700" : status === "damda" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  const label = status === "ishlaydi" ? "Ishlaydi" : status === "damda" ? "Damda" : "Ketgan";
  return <span className={`apple-badge ${style}`}>{label}</span>;
}

function RoleBadge({ role }: { role: UserRole }) {
  const style = role === "admin" ? "bg-violet-100 text-violet-700" : role === "manager" ? "bg-blue-100 text-blue-700" : "bg-black/5 text-black/60";
  return <span className={`apple-badge ${style}`}>{ROLE_LABELS[role]}</span>;
}

function Loading() {
  return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-[#0071e3] border-t-transparent animate-spin" /></div>;
}
