import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { buildLoginUrl, generatePassword, slugifyLogin } from "@/lib/access";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, serializePanels } from "@/lib/permissions";
import { and, desc, eq, sql } from "drizzle-orm";

async function uniqueLogin(base: string) {
  const safeBase = slugifyLogin(base) || "hr";
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? safeBase : `${safeBase}${index}`;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.login, candidate)).limit(1);
    if (!existing) return candidate;
  }
  return `${safeBase}${Date.now()}`;
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
  if (!name || !domainPrefix) return jsonError("Korxona nomi va domain prefix majburiy", 400);

  const [tenant] = await db
    .insert(tenants)
    .values({
      ...body,
      name,
      domainPrefix,
      employeeCount: Math.max(Number(body.employeeCount || 0), 1),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : new Date(Date.now() + 30 * 86400000),
    })
    .returning();

  const hrLogin = await uniqueLogin(`${domainPrefix}.hr`);
  const hrPassword = String(body.hrPassword || generatePassword(10));
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
