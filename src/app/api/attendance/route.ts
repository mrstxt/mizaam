import { db } from "@/db";
import { attendance, users } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  const days = searchParams.get("days");

  const conditions = [];
  if (date) conditions.push(eq(attendance.date, date));
  if (userId) conditions.push(eq(attendance.userId, Number(userId)));
  if (days) {
    const since = new Date(Date.now() - Number(days) * 86400000).toISOString().split("T")[0];
    conditions.push(gte(attendance.date, since));
  }

  const result = await db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      date: attendance.date,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      status: attendance.status,
      reason: attendance.reason,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(attendance)
    .innerJoin(users, eq(users.id, attendance.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(attendance.date), desc(attendance.checkIn));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [record] = await db.insert(attendance).values(body).returning();
  return Response.json(record, { status: 201 });
}
