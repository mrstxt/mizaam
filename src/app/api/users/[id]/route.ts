import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { authorize, canManageRole, jsonError } from "@/lib/auth";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, isPanelKey, isUserRole, parsePanelAccess, serializePanels, type PanelKey, type UserRole } from "@/lib/permissions";
import { eq } from "drizzle-orm";

const statuses = ["ishlaydi", "ishdan_ketgan", "damda"] as const;
type UserStatus = (typeof statuses)[number];

function isStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && statuses.includes(value as UserStatus);
}

function normalizeOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function normalizeLogin(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizePanels(value: unknown, role: UserRole) {
  if (role === "admin") return serializePanels(DEFAULT_PANELS_BY_ROLE.admin);
  const rawPanels = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : DEFAULT_PANELS_BY_ROLE[role];
  const panels = rawPanels.filter((panel): panel is PanelKey => isPanelKey(panel));
  const safePanels = role === "manager" ? panels.filter((panel) => panel !== "superadmin") : panels;
  return serializePanels(safePanels.length > 0 ? safePanels : DEFAULT_PANELS_BY_ROLE[role]);
}

async function loginExists(login: string, ignoreId: number) {
  if (!login) return false;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.login, login)).limit(1);
  return Boolean(existing && existing.id !== ignoreId);
}

async function buildUpdatePayload(body: Record<string, unknown>, actorRole: UserRole, editingId: number) {
  const current = await db.select().from(users).where(eq(users.id, editingId)).limit(1);
  if (!current[0]) return { error: jsonError("Foydalanuvchi topilmadi", 404) } as const;

  const nextRole = isUserRole(body.role) ? body.role : current[0].role;
  if (!isUserRole(nextRole) || !canManageRole(actorRole, nextRole) || !canManageRole(actorRole, current[0].role as UserRole)) {
    return { error: jsonError("Bu foydalanuvchini tahrirlashga ruxsat yo'q", 403) } as const;
  }

  const firstName = String(body.firstName ?? current[0].firstName).trim();
  const lastName = String(body.lastName ?? current[0].lastName).trim();
  const login = normalizeLogin(body.login ?? current[0].login);
  const password = String(body.password ?? "");

  if (!firstName || !lastName) return { error: jsonError("Ism va familiya majburiy", 400) } as const;
  if (login && (await loginExists(login, editingId))) return { error: jsonError("Bu login band", 409) } as const;
  if (password && !isStrongEnoughPassword(password)) {
    return { error: jsonError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak", 400) } as const;
  }

  const positionId = Number(body.positionId || 0);
  const status = isStatus(body.status) ? body.status : current[0].status;

  const values: Partial<typeof users.$inferInsert> = {
    firstName,
    lastName,
    positionId: positionId > 0 ? positionId : null,
    email: normalizeOptionalText(body.email)?.toLowerCase() ?? null,
    phone: normalizeOptionalText(body.phone),
    address: normalizeOptionalText(body.address),
    education: normalizeOptionalText(body.education),
    cardNumber: normalizeOptionalText(body.cardNumber),
    telegramLogin: normalizeOptionalText(body.telegramLogin),
    status,
    role: nextRole,
    login: login || null,
    panelAccess: normalizePanels(body.panelAccess, nextRole),
    mustChangePassword: Boolean(body.mustChangePassword),
  };

  if (password) values.passwordHash = await hashPassword(password);
  if (normalizeOptionalText(body.telegramPassword)) values.telegramPassword = normalizeOptionalText(body.telegramPassword);

  return { values, current: current[0] } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const targetId = Number(id);

  if (auth.user.role === "employee" && auth.user.id !== targetId) {
    return jsonError("Boshqa foydalanuvchi ma'lumotlarini ko'rishga ruxsat yo'q", 403);
  }

  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      positionId: users.positionId,
      email: users.email,
      phone: users.phone,
      address: users.address,
      education: users.education,
      cardNumber: users.cardNumber,
      telegramLogin: users.telegramLogin,
      login: users.login,
      mustChangePassword: users.mustChangePassword,
      panelAccess: users.panelAccess,
      status: users.status,
      role: users.role,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, targetId));

  if (!user) return jsonError("Topilmadi", 404);
  return Response.json({ ...user, panels: isUserRole(user.role) ? parsePanelAccess(user.panelAccess, user.role) : [] });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, { roles: ["admin", "manager"], panel: "employees" });
  if (auth.error) return auth.error;

  const { id } = await params;
  const targetId = Number(id);
  const body = await req.json();
  const built = await buildUpdatePayload(body, auth.user.role, targetId);
  if (built.error) return built.error;

  const [updated] = await db.update(users).set(built.values).where(eq(users.id, targetId)).returning({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    login: users.login,
    role: users.role,
    panelAccess: users.panelAccess,
  });

  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "Xodim tahrirlandi",
    details: `${updated.firstName} ${updated.lastName} (${updated.login}) ma'lumotlari yangilandi`,
  });

  return Response.json({ ...updated, panels: parsePanelAccess(updated.panelAccess, updated.role as UserRole) });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, { roles: ["admin", "manager"], panel: "employees" });
  if (auth.error) return auth.error;

  const { id } = await params;
  const targetId = Number(id);
  if (auth.user.id === targetId) return jsonError("O'zingizni o'chira olmaysiz", 400);

  const [target] = await db.select({ id: users.id, role: users.role, firstName: users.firstName, lastName: users.lastName }).from(users).where(eq(users.id, targetId));
  if (!target) return jsonError("Topilmadi", 404);
  if (!isUserRole(target.role) || !canManageRole(auth.user.role, target.role)) {
    return jsonError("Bu foydalanuvchini o'chirishga ruxsat yo'q", 403);
  }

  // Foreign key xatolarini kamaytirish uchun to'liq o'chirish o'rniga statusni o'zgartiramiz.
  await db.update(users).set({ status: "ishdan_ketgan" }).where(eq(users.id, targetId));
  await db.insert(activityLogs).values({
    userId: auth.user.id,
    action: "Xodim deaktiv qilindi",
    details: `${target.firstName} ${target.lastName} ishdan ketgan holatiga o'tkazildi`,
  });

  return Response.json({ ok: true });
}
