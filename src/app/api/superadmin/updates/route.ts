import { db } from "@/db";
import { platformUpdates } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select()
    .from(platformUpdates)
    .orderBy(desc(platformUpdates.createdAt));
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [update] = await db.insert(platformUpdates).values(body).returning();
  return Response.json(update, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...data } = body;
  const [updated] = await db
    .update(platformUpdates)
    .set(data)
    .where(eq(platformUpdates.id, Number(id)))
    .returning();
  return Response.json(updated);
}
