import { db } from "@/db";
import { marketingRules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(marketingRules).orderBy(marketingRules.createdAt);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [rule] = await db.insert(marketingRules).values(body).returning();
  return Response.json(rule, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const [updated] = await db.update(marketingRules).set(data).where(eq(marketingRules.id, Number(id))).returning();
  return Response.json(updated);
}
