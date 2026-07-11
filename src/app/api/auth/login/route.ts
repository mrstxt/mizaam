import { NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { findUserForLogin, jsonError } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { getDefaultLanding, isUserRole, parsePanelAccess } from "@/lib/permissions";
import { getSessionCookieOptions, SESSION_COOKIE, signSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const login = String(body.login || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!login || !password) {
      return jsonError("Login va parolni kiriting", 400);
    }

    const user = await findUserForLogin(login);
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
        login: user.login,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        panels,
        mustChangePassword: user.mustChangePassword,
      },
      redirectTo: getDefaultLanding(user.role, panels),
    });

    response.cookies.set(SESSION_COOKIE, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error", error);
    return jsonError("Login jarayonida xatolik", 500);
  }
}
