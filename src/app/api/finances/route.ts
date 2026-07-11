import { db } from "@/db";
import { finances } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  const conditions = [];
  if (type) conditions.push(eq(finances.type, type as "daromad" | "xarajat"));

  const result = await db
    .select()
    .from(finances)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(finances.date));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [record] = await db.insert(finances).values(body).returning();
  return Response.json(record, { status: 201 });
}
