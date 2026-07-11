import { db } from "@/db";
import { positions } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(positions);
  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [pos] = await db.insert(positions).values(body).returning();
  return Response.json(pos, { status: 201 });
}
