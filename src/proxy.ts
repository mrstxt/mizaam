import { NextRequest, NextResponse } from "next/server";
import { getDefaultLanding, getPanelForPath, hasPanelAccess } from "@/lib/permissions";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const publicPaths = [
  "/login",
  "/api/auth/login",
  "/api/health",
  "/api/seed",
];

function isPublicPath(pathname: string) {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    if (pathname === "/login") {
      const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
      if (session) return NextResponse.redirect(new URL(getDefaultLanding(session.role, session.panels), request.url));
    }
    return NextResponse.next();
  }

  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Avval tizimga kiring" }, { status: 401 });
    }
    return redirectToLogin(request);
  }

  const panel = getPanelForPath(pathname);
  if (session.role === "admin" && panel && panel !== "superadmin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Admin faqat admin paneldan foydalanadi" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/superadmin", request.url));
  }

  if (panel && !hasPanelAccess(session.role, session.panels, panel)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "Bu panelga ruxsat yo'q" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/403", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
