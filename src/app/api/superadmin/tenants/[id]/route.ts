import { db } from "@/db";
import { tenants } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, Number(id)));
  if (!tenant) return Response.json({ error: "Korxona topilmadi" }, { status: 404 });
  return Response.json(tenant);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(tenants).set(body).where(eq(tenants.id, Number(id))).returning();
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(tenants).where(eq(tenants.id, Number(id)));
  return Response.json({ ok: true });
}
