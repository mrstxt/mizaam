import { db } from "@/db";
import { integrations } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const result = await db.select().from(integrations).orderBy(integrations.createdAt);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [integration] = await db.insert(integrations).values(body).returning();
  return Response.json(integration, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const [updated] = await db.update(integrations).set(data).where(eq(integrations.id, Number(id))).returning();
  return Response.json(updated);
}
