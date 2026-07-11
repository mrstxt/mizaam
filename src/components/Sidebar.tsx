"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROLE_LABELS, type PanelKey, type UserRole } from "@/lib/permissions";

type MenuItem = { href: string; label: string; icon: string; panel: PanelKey };
type MenuSection = { section: string; items: MenuItem[] };

interface SessionUser {
  id: number;
  firstName: string;
  lastName: string;
  login: string;
  role: UserRole;
  roleLabel: string;
  panels: PanelKey[];
}

const tenantMenuItems: MenuSection[] = [
  {
    section: "ASOSIY",
    items: [
      { href: "/", label: "Boshqaruv paneli", icon: "📊", panel: "dashboard" },
      { href: "/employees", label: "Xodimlar", icon: "👥", panel: "employees" },
      { href: "/attendance", label: "Davomat", icon: "📋", panel: "attendance" },
      { href: "/tasks", label: "Vazifalar", icon: "✅", panel: "tasks" },
      { href: "/reports", label: "Hisobotlar", icon: "📝", panel: "reports" },
    ],
  },
  {
    section: "MOLIYA",
    items: [
      { href: "/finance", label: "Moliyaviy holat", icon: "💰", panel: "finance" },
      { href: "/salary", label: "Oylik tarqatish", icon: "💳", panel: "salary" },
    ],
  },
  {
    section: "TAHLIL",
    items: [
      { href: "/analytics", label: "Analitika", icon: "📈", panel: "analytics" },
      { href: "/rules", label: "Qoidalar", icon: "📜", panel: "rules" },
    ],
  },
  {
    section: "CRM",
    items: [
      { href: "/crm", label: "Sotuv voronkasi", icon: "🎯", panel: "crm" },
      { href: "/marketing", label: "Marketing", icon: "📢", panel: "marketing" },
      { href: "/integrations", label: "Integratsiyalar", icon: "🔗", panel: "integrations" },
    ],
  },
  {
    section: "ALOQA",
    items: [
      { href: "/chat", label: "Chat", icon: "💬", panel: "chat" },
      { href: "/support", label: "Support", icon: "🛟", panel: "support" },
      { href: "/notifications", label: "Bildirishnomalar", icon: "🔔", panel: "notifications" },
    ],
  },
];

const superAdminMenuItems: MenuSection[] = [
  {
    section: "PLATFORMA MARKAZI",
    items: [
      { href: "/superadmin", label: "Platforma paneli", icon: "⚡", panel: "superadmin" },
      { href: "/superadmin/tenants", label: "Korxonalar (Tenants)", icon: "🏢", panel: "superadmin" },
      { href: "/superadmin/billing", label: "SaaS To'lovlar & MRR", icon: "💳", panel: "superadmin" },
      { href: "/superadmin/updates", label: "Release & E'lonlar", icon: "🚀", panel: "superadmin" },
      { href: "/superadmin/support", label: "Global Support Core", icon: "🛟", panel: "superadmin" },
    ],
  },
];

function filterMenu(menu: MenuSection[], user: SessionUser | null) {
  if (!user) return [];
  return menu
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => user.role === "admin" || user.panels.includes(item.panel)),
    }))
    .filter((section) => section.items.length > 0);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const isSuperAdmin = pathname.startsWith("/superadmin");

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data) => {
        if (mounted) setUser(data.user);
      })
      .catch(() => {
        if (mounted) setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const menuToRender = useMemo(() => {
    return filterMenu(isSuperAdmin ? superAdminMenuItems : tenantMenuItems, user);
  }, [isSuperAdmin, user]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const changePassword = async () => {
    setPasswordError("");
    setPasswordMessage("");
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Yangi parol kamida 8 ta belgidan iborat bo'lsin");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Yangi parol takrori mos emas");
      return;
    }

    setChangingPassword(true);
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword }),
    });
    const data = await response.json();
    setChangingPassword(false);
    if (!response.ok) {
      setPasswordError(data.error || "Parol o'zgartirilmadi");
      return;
    }
    setPasswordMessage("Parol muvaffaqiyatli o'zgartirildi");
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <>
    <aside
      className={`fixed top-0 left-0 h-full z-50 overflow-y-auto apple-sidebar transition-all duration-200 flex flex-col ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>MIZAAM</span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                    ADMIN
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-white/40 tracking-wider uppercase">
                {isSuperAdmin ? "Platform Admin" : user?.role === "manager" ? "HR panel" : "Biznes Boshqaruv"}
              </p>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors ml-auto"
            title={collapsed ? "Kengaytirish" : "Yig'ish"}
          >
            {collapsed ? "☰" : "✕"}
          </button>
        </div>

        {!collapsed ? (
          <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <Link
              href="/"
              className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all ${
                !isSuperAdmin ? "bg-[#0071e3] text-white shadow" : "text-white/60 hover:text-white"
              }`}
            >
              🏢 Panel
            </Link>
            {(user?.role === "admin" || user?.panels.includes("superadmin")) && (
              <Link
                href="/superadmin"
                className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-1 ${
                  isSuperAdmin
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow font-semibold"
                    : "text-amber-400/80 hover:text-amber-300"
                }`}
              >
                <span>⚡ Admin</span>
              </Link>
            )}
          </div>
        ) : (
          <Link
            href={isSuperAdmin ? "/" : "/superadmin"}
            className="w-full py-2 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isSuperAdmin ? "Korxona paneliga o'tish" : "Admin paneliga o'tish"}
          >
            {isSuperAdmin ? "🏢" : "⚡"}
          </Link>
        )}
      </div>

      <nav className="p-3 space-y-5 flex-1 overflow-y-auto">
        {menuToRender.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p
                className={`text-[10px] font-semibold uppercase tracking-[0.08em] px-3 mb-1.5 ${
                  isSuperAdmin ? "text-amber-400/60" : "text-white/30"
                }`}
              >
                {section.section}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.href === "/" || item.href === "/superadmin" ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 apple-sidebar-link ${
                        isActive
                          ? isSuperAdmin
                            ? "bg-gradient-to-r from-amber-500/30 to-orange-500/30 text-amber-200 border border-amber-500/30 font-semibold"
                            : "active text-white font-medium"
                          : "text-white/60 hover:text-white"
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="text-lg shrink-0 w-6 text-center">{item.icon}</span>
                      {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4 border-t border-white/10 shrink-0 bg-black/20">
          {user ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user.firstName} {user.lastName}</p>
                <p className="text-[11px] text-white/40 truncate">{ROLE_LABELS[user.role]} • @{user.login}</p>
              </div>
            </div>
          ) : (
            <div className="h-12 rounded-xl bg-white/5 animate-pulse mb-3" />
          )}
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-3">
            <span>Holat:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
            </span>
          </div>
          <button onClick={() => { setShowPasswordModal(true); setPasswordError(""); setPasswordMessage(""); }} className="w-full rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white py-2 text-xs font-medium transition-colors mb-2">
            Parolni o'zgartirish
          </button>
          <button onClick={logout} className="w-full rounded-xl bg-white/10 hover:bg-red-500/20 text-white/70 hover:text-red-200 py-2 text-xs font-medium transition-colors">
            Chiqish
          </button>
        </div>
      )}
    </aside>

    {showPasswordModal && (
      <div className="fixed inset-0 z-[80] bg-black/30 apple-modal-overlay flex items-center justify-center p-4" onClick={() => setShowPasswordModal(false)}>
        <div className="apple-modal w-full max-w-md p-6" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-black/90">Parolni o'zgartirish</h2>
              <p className="text-sm text-black/45 mt-1">Joriy parolni kiriting va yangi parol belgilang.</p>
            </div>
            <button onClick={() => setShowPasswordModal(false)} className="apple-btn apple-btn-secondary px-4">✕</button>
          </div>

          {(passwordError || passwordMessage) && (
            <div className={`rounded-2xl px-4 py-3 text-sm mb-4 border ${passwordError ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
              {passwordError || passwordMessage}
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-1.5">Joriy parol</span>
              <input type="password" value={passwordForm.oldPassword} onChange={(event) => setPasswordForm({ ...passwordForm, oldPassword: event.target.value })} className="apple-input w-full" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-1.5">Yangi parol</span>
              <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} className="apple-input w-full" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-black/50 mb-1.5">Yangi parol takrori</span>
              <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} className="apple-input w-full" />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowPasswordModal(false)} className="apple-btn apple-btn-secondary">Bekor qilish</button>
              <button onClick={changePassword} disabled={changingPassword} className="apple-btn disabled:opacity-60">{changingPassword ? "Saqlanmoqda..." : "Saqlash"}</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
