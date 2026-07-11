import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user] = await db.select().from(users).where(eq(users.id, Number(id)));
  if (!user) return Response.json({ error: "Topilmadi" }, { status: 404 });
  return Response.json(user);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [updated] = await db.update(users).set(body).where(eq(users.id, Number(id))).returning();
  return Response.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(users).where(eq(users.id, Number(id)));
  return Response.json({ ok: true });
}
