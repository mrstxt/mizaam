import { db } from "@/db";
import { activityLogs, positions, users } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { authorize, canManageRole, jsonError } from "@/lib/auth";
import { buildLoginUrl, generatePassword } from "@/lib/access";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import {
  DEFAULT_PANELS_BY_ROLE,
  isPanelKey,
  isUserRole,
  parsePanelAccess,
  serializePanels,
  type PanelKey,
  type UserRole,
} from "@/lib/permissions";

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

  // HR roliga platform superadmin panelini berib yubormaymiz.
  const safePanels = role === "manager" ? panels.filter((panel) => panel !== "superadmin") : panels;
  return serializePanels(safePanels.length > 0 ? safePanels : DEFAULT_PANELS_BY_ROLE[role]);
}

async function loginExists(login: string, ignoreId?: number) {
  if (!login) return false;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.login, login))
    .limit(1);
  return Boolean(existing && existing.id !== ignoreId);
}

async function buildUserPayload(body: Record<string, unknown>, actorRole: UserRole, editingId?: number) {
  const role = isUserRole(body.role) ? body.role : "employee";
  if (!canManageRole(actorRole, role)) {
    return { error: jsonError("Bu rolni yaratish yoki tahrirlashga ruxsat yo'q", 403) } as const;
  }

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  let login = normalizeLogin(body.login);
  if (!editingId && !login) login = normalizeLogin(`${firstName}.${lastName}`);
  const providedPassword = String(body.password ?? "");
  const password = !editingId && !providedPassword ? generatePassword(10) : providedPassword;

  if (!firstName || !lastName) return { error: jsonError("Ism va familiya majburiy", 400) } as const;
  if (!editingId && !login) return { error: jsonError("Login yaratish uchun ism/familiya majburiy", 400) } as const;
  if (login && (await loginExists(login, editingId))) return { error: jsonError("Bu login band", 409) } as const;
  if (!editingId && !isStrongEnoughPassword(password)) {
    return { error: jsonError("Parol kamida 8 ta belgidan iborat bo'lishi kerak", 400) } as const;
  }
  if (editingId && password && !isStrongEnoughPassword(password)) {
    return { error: jsonError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak", 400) } as const;
  }

  const positionId = Number(body.positionId || 0);
  const status = isStatus(body.status) ? body.status : "ishlaydi";

  const tenantId = actorRole === "manager" ? (body.actorTenantId as number | null | undefined) : Number(body.tenantId || 0) || null;

  const values: typeof users.$inferInsert = {
    tenantId,
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
    role,
    panelAccess: normalizePanels(body.panelAccess, role),
    mustChangePassword: Boolean(body.mustChangePassword),
  };

  if (login) values.login = login;
  if (password) values.passwordHash = await hashPassword(password);
  if (normalizeOptionalText(body.telegramPassword)) values.telegramPassword = normalizeOptionalText(body.telegramPassword);

  return { values, plainPassword: !editingId ? password : undefined } as const;
}

export async function GET(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const positionId = searchParams.get("positionId");

  const conditions = [];
  if (isStatus(status)) conditions.push(eq(users.status, status));
  if (positionId) conditions.push(eq(users.positionId, Number(positionId)));
  if (search) {
    conditions.push(sql`(${users.firstName} || ' ' || ${users.lastName} || ' ' || coalesce(${users.login}, '') || ' ' || coalesce(${users.phone}, '')) ilike ${`%${search}%`}`);
  }

  if (auth.user.role === "manager" && auth.user.tenantId) {
    conditions.push(eq(users.tenantId, auth.user.tenantId));
  }

  // Oddiy xodimlar faqat aktiv xodimlar ro'yxatini chat uchun ko'radi.
  if (auth.user.role === "employee") {
    conditions.push(eq(users.status, "ishlaydi"));
    if (auth.user.tenantId) conditions.push(eq(users.tenantId, auth.user.tenantId));
  }

  const result = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: auth.user.role === "employee" ? sql<string | null>`null` : users.email,
      phone: auth.user.role === "employee" ? sql<string | null>`null` : users.phone,
      address: auth.user.role === "employee" ? sql<string | null>`null` : users.address,
      education: auth.user.role === "employee" ? sql<string | null>`null` : users.education,
      cardNumber: auth.user.role === "employee" ? sql<string | null>`null` : users.cardNumber,
      telegramLogin: auth.user.role === "employee" ? sql<string | null>`null` : users.telegramLogin,
      login: users.login,
      mustChangePassword: users.mustChangePassword,
      panelAccess: users.panelAccess,
      status: users.status,
      role: users.role,
      positionId: users.positionId,
      positionName: positions.name,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(positions, eq(positions.id, users.positionId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));

  return Response.json(
    result.map((user) => ({
      ...user,
      panels: isUserRole(user.role) ? parsePanelAccess(user.panelAccess, user.role) : [],
    }))
  );
}

export async function POST(request: Request) {
  const auth = await authorize(request, { roles: ["admin", "manager"], panel: "employees" });
  if (auth.error) return auth.error;

  const body = await request.json();
  body.actorTenantId = auth.user.tenantId ?? null;
  const built = await buildUserPayload(body, auth.user.role);
  if (built.error) return built.error;

  try {
    const [user] = await db.insert(users).values(built.values).returning({
      id: users.id,
      tenantId: users.tenantId,
      firstName: users.firstName,
      lastName: users.lastName,
      login: users.login,
      role: users.role,
      panelAccess: users.panelAccess,
    });

    await db.insert(activityLogs).values({
      userId: auth.user.id,
      action: "Xodim qo'shildi",
      details: `${user.firstName} ${user.lastName} (${user.login}) yaratildi`,
    });

    return Response.json(
      {
        ...user,
        panels: parsePanelAccess(user.panelAccess, user.role as UserRole),
        access: {
          login: user.login,
          password: built.plainPassword,
          loginUrl: buildLoginUrl(request, user.login),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error", error);
    return jsonError("Xodim yaratishda xatolik. Login yoki email band bo'lishi mumkin", 500);
  }
}
