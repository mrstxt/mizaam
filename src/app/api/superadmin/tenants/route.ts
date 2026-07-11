import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { buildLoginUrl, slugifyLogin } from "@/lib/access";
import { hashPassword, isStrongEnoughPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, serializePanels } from "@/lib/permissions";
import { and, desc, eq, sql } from "drizzle-orm";

async function loginExists(login: string) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.login, login)).limit(1);
  return Boolean(existing);
}

function splitName(fullName: string | null | undefined, fallback: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: fallback, lastName: "HR" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || "HR" };
}

export async function GET(request: Request) {
  const auth = await authorize(request, { roles: ["admin"], panel: "superadmin" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");

  const conditions = [];
  if (status) conditions.push(eq(tenants.status, status as "active" | "trial" | "suspended" | "cancelled"));
  if (plan) conditions.push(eq(tenants.plan, plan as "trial" | "free" | "pro" | "premium" | "enterprise"));
  if (search) conditions.push(sql`${tenants.name} ilike ${`%${search}%`}`);

  const result = await db
    .select()
    .from(tenants)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tenants.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const auth = await authorize(request, { roles: ["admin"], panel: "superadmin" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = String(body.name || "").trim();
  const domainPrefix = slugifyLogin(String(body.domainPrefix || name).replace(/\./g, ""));
  const hrLogin = String(body.hrLogin || "").trim().toLowerCase();
  const hrPassword = String(body.hrPassword || "");

  if (!name || !domainPrefix) return jsonError("Korxona nomi va domain prefix majburiy", 400);
  if (!hrLogin || !hrPassword) return jsonError("HR login va HR parol majburiy", 400);
  if (!isStrongEnoughPassword(hrPassword)) return jsonError("HR parol kamida 8 ta belgidan iborat bo'lishi kerak", 400);
  if (await loginExists(hrLogin)) return jsonError("Bu HR login band. Boshqa login kiriting", 409);

  const [tenant] = await db
    .insert(tenants)
    .values({
      name,
      domainPrefix,
      plan: body.plan || "pro",
      status: body.status || "active",
      hasFaceIdModule: Boolean(body.hasFaceIdModule),
      hasCrmModule: body.hasCrmModule !== false,
      employeeCount: Math.max(Number(body.employeeCount || 0), 1),
      maxEmployees: Number(body.maxEmployees || 50),
      monthlyFee: Number(body.monthlyFee || 0),
      contactName: body.contactName || null,
      contactPhone: body.contactPhone || null,
      contactEmail: body.contactEmail || null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 30 * 86400000),
    })
    .returning();

  const hrName = splitName(body.contactName, name.split(" ")[0] || "Kompaniya");

  const [hrUser] = await db
    .insert(users)
    .values({
      tenantId: tenant.id,
      firstName: hrName.firstName,
      lastName: hrName.lastName,
      email: body.contactEmail || null,
      phone: body.contactPhone || null,
      login: hrLogin,
      passwordHash: await hashPassword(hrPassword),
      role: "manager",
      status: "ishlaydi",
      panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.manager),
      mustChangePassword: false,
    })
    .returning({ id: users.id, login: users.login, firstName: users.firstName, lastName: users.lastName });

  return Response.json(
    {
      ...tenant,
      access: {
        tenantId: tenant.id,
        userId: hrUser.id,
        role: "HR",
        login: hrLogin,
        password: hrPassword,
        loginUrl: buildLoginUrl(request, hrLogin),
      },
    },
    { status: 201 }
  );
}
