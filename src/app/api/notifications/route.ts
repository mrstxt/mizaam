import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const result = await db
    .select()
    .from(notifications)
    .where(status ? eq(notifications.status, status as "kutilmoqda" | "yuborildi" | "rejalashtirilgan") : undefined)
    .orderBy(desc(notifications.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [notification] = await db.insert(notifications).values(body).returning();
  return Response.json(notification, { status: 201 });
}
