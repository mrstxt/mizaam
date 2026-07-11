export type UserRole = "admin" | "manager" | "employee";

export type PanelKey =
  | "dashboard"
  | "employees"
  | "attendance"
  | "tasks"
  | "reports"
  | "finance"
  | "salary"
  | "analytics"
  | "rules"
  | "crm"
  | "marketing"
  | "integrations"
  | "chat"
  | "support"
  | "notifications"
  | "superadmin";

export const PANEL_DEFINITIONS: { key: PanelKey; label: string; description: string }[] = [
  { key: "dashboard", label: "Boshqaruv paneli", description: "Umumiy statistika va tezkor ko'rsatkichlar" },
  { key: "employees", label: "Xodimlar", description: "Xodim qo'shish, tahrirlash va login-parol berish" },
  { key: "attendance", label: "Davomat", description: "Davomat monitoringi va belgilash" },
  { key: "tasks", label: "Vazifalar", description: "Vazifa berish va ijroni nazorat qilish" },
  { key: "reports", label: "Hisobotlar", description: "Kunlik hisobotlarni ko'rish va tasdiqlash" },
  { key: "finance", label: "Moliya", description: "Daromad/xarajat va moliyaviy holat" },
  { key: "salary", label: "Oylik", description: "Oylik tarqatish va KPI bonuslar" },
  { key: "analytics", label: "Analitika", description: "KPI, konversiya va hisobotlar tahlili" },
  { key: "rules", label: "Qoidalar", description: "Ish vaqti, jarima va bonus qoidalari" },
  { key: "crm", label: "CRM", description: "Lidlar va sotuv voronkasi" },
  { key: "marketing", label: "Marketing", description: "Marketing avtomatizatsiyasi" },
  { key: "integrations", label: "Integratsiyalar", description: "Telegram, sayt va tashqi ulanishlar" },
  { key: "chat", label: "Chat", description: "Ichki xabar almashish" },
  { key: "support", label: "Support", description: "Murojaatlar va yordam markazi" },
  { key: "notifications", label: "Bildirishnomalar", description: "Xodimlarga xabar yuborish" },
  { key: "superadmin", label: "Platforma admini", description: "SaaS/tenant va global boshqaruv" },
];

export const ALL_PANELS = PANEL_DEFINITIONS.map((panel) => panel.key);

export const DEFAULT_PANELS_BY_ROLE: Record<UserRole, PanelKey[]> = {
  admin: ALL_PANELS,
  // DBdagi `manager` roli UI'da HR paneli sifatida ishlatiladi.
  manager: [
    "dashboard",
    "employees",
    "attendance",
    "tasks",
    "reports",
    "analytics",
    "chat",
    "support",
    "notifications",
  ],
  employee: ["dashboard", "attendance", "tasks", "reports", "chat", "support", "notifications"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  manager: "HR",
  employee: "Xodim",
};

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "manager" || value === "employee";
}

export function serializePanels(panels: PanelKey[] | string[] | null | undefined): string | null {
  if (!panels) return null;
  const normalized = panels.filter((panel): panel is PanelKey => isPanelKey(panel));
  return Array.from(new Set(normalized)).join(",");
}

export function isPanelKey(value: unknown): value is PanelKey {
  return typeof value === "string" && (ALL_PANELS as string[]).includes(value);
}

export function parsePanelAccess(panelAccess: string | null | undefined, role: UserRole): PanelKey[] {
  if (role === "admin") return DEFAULT_PANELS_BY_ROLE.admin;

  const fallback = DEFAULT_PANELS_BY_ROLE[role] ?? DEFAULT_PANELS_BY_ROLE.employee;
  if (!panelAccess?.trim()) return fallback;

  const parsed = panelAccess
    .split(",")
    .map((panel) => panel.trim())
    .filter((panel): panel is PanelKey => isPanelKey(panel));

  return parsed.length > 0 ? Array.from(new Set(parsed)) : fallback;
}

export function hasPanelAccess(role: UserRole, panels: PanelKey[] | undefined, panel: PanelKey): boolean {
  if (role === "admin") return true;
  return Boolean(panels?.includes(panel));
}

export function getDefaultLanding(role: UserRole, panels: PanelKey[] = DEFAULT_PANELS_BY_ROLE[role]): string {
  if (role === "admin") return "/";
  if (role === "manager") return panels.includes("employees") ? "/employees" : "/";
  if (panels.includes("tasks")) return "/tasks";
  if (panels.includes("reports")) return "/reports";
  return "/";
}

export function getPanelForPath(pathname: string): PanelKey | null {
  if (pathname.startsWith("/api/dashboard") || pathname.startsWith("/api/activity")) return "dashboard";
  if (pathname.startsWith("/api/attendance")) return "attendance";
  if (pathname.startsWith("/api/tasks")) return "tasks";
  if (pathname.startsWith("/api/reports")) return "reports";
  if (pathname.startsWith("/api/finances")) return "finance";
  if (pathname.startsWith("/api/salary")) return "salary";
  if (pathname.startsWith("/api/analytics")) return "analytics";
  if (pathname.startsWith("/api/rules")) return "rules";
  if (pathname.startsWith("/api/leads") || pathname.startsWith("/api/lost-reasons")) return "crm";
  if (pathname.startsWith("/api/marketing")) return "marketing";
  if (pathname.startsWith("/api/integrations")) return "integrations";
  if (pathname.startsWith("/api/chat")) return "chat";
  if (pathname.startsWith("/api/support")) return "support";
  if (pathname.startsWith("/api/notifications")) return "notifications";
  if (pathname.startsWith("/api/superadmin")) return "superadmin";
  if (pathname.startsWith("/api/positions")) return "employees";

  if (pathname === "/") return "dashboard";
  if (pathname.startsWith("/superadmin")) return "superadmin";
  if (pathname.startsWith("/employees")) return "employees";
  if (pathname.startsWith("/attendance")) return "attendance";
  if (pathname.startsWith("/tasks")) return "tasks";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/finance")) return "finance";
  if (pathname.startsWith("/salary")) return "salary";
  if (pathname.startsWith("/analytics")) return "analytics";
  if (pathname.startsWith("/rules")) return "rules";
  if (pathname.startsWith("/crm")) return "crm";
  if (pathname.startsWith("/marketing")) return "marketing";
  if (pathname.startsWith("/integrations")) return "integrations";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/support")) return "support";
  if (pathname.startsWith("/notifications")) return "notifications";
  return null;
}
