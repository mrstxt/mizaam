import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const plan = searchParams.get("plan");
  const search = searchParams.get("search");

  const conditions = [];
  if (status) conditions.push(eq(tenants.status, status as "active" | "trial" | "suspended" | "cancelled"));
  if (plan) conditions.push(eq(tenants.plan, plan as "trial" | "free" | "pro" | "premium" | "enterprise"));
  if (search) {
    conditions.push(sql`${tenants.name} ilike ${`%${search}%`}`);
  }

  const result = await db
    .select()
    .from(tenants)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tenants.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [tenant] = await db.insert(tenants).values(body).returning();
  return Response.json(tenant, { status: 201 });
}
