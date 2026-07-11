import { db } from "@/db";
import { tenants, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { buildLoginUrl, generatePassword, slugifyLogin } from "@/lib/access";
import { hashPassword } from "@/lib/password";
import { DEFAULT_PANELS_BY_ROLE, serializePanels } from "@/lib/permissions";
import { and, eq } from "drizzle-orm";

async function uniqueLogin(base: string, currentUserId?: number) {
  const safeBase = slugifyLogin(base) || "hr";
  for (let index = 0; index < 100; index += 1) {
    const candidate = index === 0 ? safeBase : `${safeBase}${index}`;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.login, candidate)).limit(1);
    if (!existing || existing.id === currentUserId) return candidate;
  }
  return `${safeBase}${Date.now()}`;
}

function splitName(fullName: string | null | undefined, fallback: string) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: fallback, lastName: "HR" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || "HR" };
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(request, { roles: ["admin"], panel: "superadmin" });
  if (auth.error) return auth.error;

  const { id } = await params;
  const tenantId = Number(id);
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  if (!tenant) return jsonError("Korxona topilmadi", 404);

  const password = generatePassword(10);
  const [existingHr] = await db
    .select({ id: users.id, login: users.login })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.role, "manager")))
    .limit(1);

  const login = await uniqueLogin(`${tenant.domainPrefix}.hr`, existingHr?.id);
  const hrName = splitName(tenant.contactName, tenant.name.split(" ")[0] || "Kompaniya");

  let userId: number;
  if (existingHr) {
    const [updated] = await db
      .update(users)
      .set({
        login,
        passwordHash: await hashPassword(password),
        status: "ishlaydi",
        panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.manager),
      })
      .where(eq(users.id, existingHr.id))
      .returning({ id: users.id });
    userId = updated.id;
  } else {
    const [created] = await db
      .insert(users)
      .values({
        tenantId,
        firstName: hrName.firstName,
        lastName: hrName.lastName,
        email: tenant.contactEmail,
        phone: tenant.contactPhone,
        login,
        passwordHash: await hashPassword(password),
        role: "manager",
        status: "ishlaydi",
        panelAccess: serializePanels(DEFAULT_PANELS_BY_ROLE.manager),
      })
      .returning({ id: users.id });
    userId = created.id;
  }

  return Response.json({
    ok: true,
    access: {
      tenantId,
      userId,
      role: "HR",
      login,
      password,
      loginUrl: buildLoginUrl(request, login),
    },
  });
}
