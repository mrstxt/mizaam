import { db } from "@/db";
import { rules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(rules).orderBy(rules.createdAt);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [rule] = await db.insert(rules).values(body).returning();
  return Response.json(rule, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const [updated] = await db.update(rules).set(data).where(eq(rules.id, Number(id))).returning();
  return Response.json(updated);
}
