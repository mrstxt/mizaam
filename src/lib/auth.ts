import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { getSessionFromCookieHeader, type SessionUser } from "./session";
import { hasPanelAccess, isUserRole, parsePanelAccess, type PanelKey, type UserRole } from "./permissions";

export type AuthenticatedUser = SessionUser;

export async function getSessionFromRequest(request: Request) {
  return getSessionFromCookieHeader(request.headers.get("cookie"));
}

export async function getFreshSessionUser(request: Request) {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  const [user] = await db
    .select({
      id: users.id,
      tenantId: users.tenantId,
      login: users.login,
      firstName: users.firstName,
      lastName: users.lastName,
      role: users.role,
      status: users.status,
      panelAccess: users.panelAccess,
    })
    .from(users)
    .where(eq(users.id, session.id))
    .limit(1);

  if (!user || user.status !== "ishlaydi" || !isUserRole(user.role)) return null;

  return {
    ...session,
    tenantId: user.tenantId ?? null,
    login: user.login || session.login,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    panels: parsePanelAccess(user.panelAccess, user.role),
  };
}

export async function findUserForLogin(login: string) {
  const normalized = login.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.login, normalized), eq(users.email, normalized)))
    .limit(1);
  return user;
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return Response.json({ ok: false, error: message, details }, { status });
}

export async function authorize(
  request: Request,
  options: { roles?: UserRole[]; panel?: PanelKey } = {}
): Promise<{ user: AuthenticatedUser; error?: never } | { user?: never; error: Response }> {
  const user = await getFreshSessionUser(request);
  if (!user) return { error: jsonError("Avval tizimga kiring", 401) };

  if (options.roles && !options.roles.includes(user.role)) {
    return { error: jsonError("Bu amal uchun ruxsat yo'q", 403) };
  }

  if (options.panel && !hasPanelAccess(user.role, user.panels, options.panel)) {
    return { error: jsonError("Bu panelga ruxsat yo'q", 403) };
  }

  return { user };
}

export function canManageRole(actorRole: UserRole, targetRole: UserRole) {
  if (actorRole === "admin") return true;
  if (actorRole === "manager") return targetRole === "employee";
  return false;
}
