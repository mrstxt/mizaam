"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tenantMenuItems = [
  {
    section: "ASOSIY",
    items: [
      { href: "/", label: "Boshqaruv paneli", icon: "📊" },
      { href: "/employees", label: "Xodimlar", icon: "👥" },
      { href: "/attendance", label: "Davomat", icon: "📋" },
      { href: "/tasks", label: "Vazifalar", icon: "✅" },
      { href: "/reports", label: "Hisobotlar", icon: "📝" },
    ],
  },
  {
    section: "MOLIYA",
    items: [
      { href: "/finance", label: "Moliyaviy holat", icon: "💰" },
      { href: "/salary", label: "Oylik tarqatish", icon: "💳" },
    ],
  },
  {
    section: "TAHLIL",
    items: [
      { href: "/analytics", label: "Analitika", icon: "📈" },
      { href: "/rules", label: "Qoidalar", icon: "📜" },
    ],
  },
  {
    section: "CRM",
    items: [
      { href: "/crm", label: "Sotuv voronkasi", icon: "🎯" },
      { href: "/marketing", label: "Marketing", icon: "📢" },
      { href: "/integrations", label: "Integratsiyalar", icon: "🔗" },
    ],
  },
  {
    section: "ALOQA",
    items: [
      { href: "/chat", label: "Chat", icon: "💬" },
      { href: "/support", label: "Support", icon: "🛟" },
      { href: "/notifications", label: "Bildirishnomalar", icon: "🔔" },
    ],
  },
];

const superAdminMenuItems = [
  {
    section: "PLATFORMA MARKAZI",
    items: [
      { href: "/superadmin", label: "Platforma paneli", icon: "⚡" },
      { href: "/superadmin/tenants", label: "Korxonalar (Tenants)", icon: "🏢" },
      { href: "/superadmin/billing", label: "SaaS To'lovlar & MRR", icon: "💳" },
      { href: "/superadmin/updates", label: "Release & E'lonlar", icon: "🚀" },
      { href: "/superadmin/support", label: "Global Support Core", icon: "🛟" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const isSuperAdmin = pathname.startsWith("/superadmin");

  const menuToRender = isSuperAdmin ? superAdminMenuItems : tenantMenuItems;

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-50 overflow-y-auto apple-sidebar transition-all duration-200 flex flex-col ${
        collapsed ? "w-[72px]" : "w-[240px]"
      }`}
    >
      {/* Top Header & Mode Switcher */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>MIZAAM</span>
                {isSuperAdmin && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">
                    SUPER
                  </span>
                )}
              </h1>
              <p className="text-[10px] text-white/40 tracking-wider uppercase">
                {isSuperAdmin ? "Platform Engine" : "Biznes Boshqaruv"}
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

        {/* Mode Switcher Buttons */}
        {!collapsed ? (
          <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <Link
              href="/"
              className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all ${
                !isSuperAdmin
                  ? "bg-[#0071e3] text-white shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              🏢 Korxona
            </Link>
            <Link
              href="/superadmin"
              className={`py-1.5 px-2 rounded-lg text-center font-medium transition-all flex items-center justify-center gap-1 ${
                isSuperAdmin
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow font-semibold"
                  : "text-amber-400/80 hover:text-amber-300"
              }`}
            >
              <span>⚡ O&apos;zimiz</span>
            </Link>
          </div>
        ) : (
          <Link
            href={isSuperAdmin ? "/" : "/superadmin"}
            className="w-full py-2 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={isSuperAdmin ? "Korxona paneliga o'tish" : "Superadmin paneliga o'tish"}
          >
            {isSuperAdmin ? "🏢" : "⚡"}
          </Link>
        )}
      </div>

      {/* Navigation */}
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
                const isActive =
                  item.href === "/" || item.href === "/superadmin"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
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
                      <span className="text-lg shrink-0 w-6 text-center">
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="text-[13px] font-medium truncate">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom Info */}
      {!collapsed && (
        <div className="px-5 py-4 border-t border-white/10 shrink-0 bg-black/20">
          <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
            <span>Holat:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />{" "}
              SaaS Online
            </span>
          </div>
          <p className="text-[10px] text-white/20 text-center tracking-wider mt-2">
            {isSuperAdmin ? "MIZAAM CORE ENGINE" : "MIZAAM v1.0 MVP"}
          </p>
        </div>
      )}
    </aside>
  );
}
