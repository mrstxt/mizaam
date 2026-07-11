import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, tenants, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { findUserForLogin, jsonError } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, getDefaultLanding, isUserRole, parsePanelAccess, serializePanels } from "@/lib/permissions";
import { getSessionCookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";

const DEFAULT_ADMIN_LOGIN = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";

async function ensureDefaultAdminForFirstLogin(password: string) {
  if (password !== DEFAULT_ADMIN_PASSWORD) return;

  const [byLogin] = await db.select().from(users).where(eq(users.login, DEFAULT_ADMIN_LOGIN)).limit(1);

  if (byLogin) {
    // Eski deploylarda admin parol boshqa bo'lgan bo'lishi mumkin. Birinchi kirishgacha admin123 ni yoqamiz.
    if (!byLogin.passwordHash || !byLogin.passwordChangedAt) {
      await db
        .update(users)
        .set({
          passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
          role: "admin",
          status: "ishlaydi",
          panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.admin),
        })
        .where(eq(users.id, byLogin.id));
    }
    return;
  }

  const [existingAdmin] = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (existingAdmin) {
    await db
      .update(users)
      .set({
        login: DEFAULT_ADMIN_LOGIN,
        passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
        role: "admin",
        status: "ishlaydi",
        panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.admin),
      })
      .where(eq(users.id, existingAdmin.id));
    return;
  }

  await db.insert(users).values({
    firstName: "Mizaam",
    lastName: "Admin",
    login: DEFAULT_ADMIN_LOGIN,
    passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
    role: "admin",
    status: "ishlaydi",
    panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.admin),
    mustChangePassword: false,
  });
}

async function findUserForTenantLogin(tenantLogin: string, login?: string) {
  const [tenant] = await db
    .select({ id: tenants.id, domainPrefix: tenants.domainPrefix, status: tenants.status })
    .from(tenants)
    .where(eq(tenants.domainPrefix, tenantLogin))
    .limit(1);

  if (!tenant || tenant.status === "suspended" || tenant.status === "cancelled") return null;

  if (login) {
    const user = await findUserForLogin(login);
    if (!user || user.tenantId !== tenant.id) return null;
    return user;
  }

  const [hrUser] = await db
    .select()
    .from(users)
    .where(and(eq(users.tenantId, tenant.id), eq(users.role, "manager"), eq(users.status, "ishlaydi")))
    .limit(1);

  return hrUser ?? null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || "").trim().toLowerCase();
    const tenantLogin = String(body.tenantLogin || body.companyLogin || "").trim().toLowerCase();
    const password = String(body.password || "");

    if ((!login && !tenantLogin) || !password) {
      return jsonError("Login/parol yoki kompaniya parolini kiriting", 400);
    }

    if (!tenantLogin && login === DEFAULT_ADMIN_LOGIN) {
      await ensureDefaultAdminForFirstLogin(password);
    }

    const user = tenantLogin ? await findUserForTenantLogin(tenantLogin, login || undefined) : await findUserForLogin(login);
    if (!user || user.status !== "ishlaydi" || !isUserRole(user.role)) {
      return jsonError("Login yoki parol noto'g'ri", 401);
    }

    const passwordOk = await verifyPassword(password, user.passwordHash);
    if (!passwordOk) {
      return jsonError("Login yoki parol noto'g'ri", 401);
    }

    const panels = parsePanelAccess(user.panelAccess, user.role);
    const token = await signSession({
      id: user.id,
      tenantId: user.tenantId ?? null,
      login: user.login || user.email || login,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      panels,
    });

    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
    await db.insert(activityLogs).values({
      userId: user.id,
      action: "Tizimga kirildi",
      details: `${user.firstName} ${user.lastName} login orqali kirdi`,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        tenantId: user.tenantId,
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        panels,
        mustChangePassword: user.mustChangePassword,
      },
      redirectTo: user.role === "admin" ? "/superadmin" : getDefaultLanding(user.role, panels),
    });

    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error", error);
    return jsonError("Login jarayonida xatolik", 500);
  }
}
