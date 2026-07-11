import { db } from "@/db";
import { dailyReports, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  const conditions = [];
  if (status) conditions.push(eq(dailyReports.status, status as "kutilmoqda" | "tasdiqlangan" | "rad_etilgan"));
  if (userId) conditions.push(eq(dailyReports.userId, Number(userId)));
  if (date) conditions.push(eq(dailyReports.date, date));

  const result = await db
    .select({
      id: dailyReports.id,
      userId: dailyReports.userId,
      date: dailyReports.date,
      content: dailyReports.content,
      status: dailyReports.status,
      rejectionReason: dailyReports.rejectionReason,
      createdAt: dailyReports.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(dailyReports)
    .innerJoin(users, eq(users.id, dailyReports.userId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(dailyReports.date));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [report] = await db.insert(dailyReports).values(body).returning();
  return Response.json(report, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status, rejectionReason } = body;
  const [updated] = await db
    .update(dailyReports)
    .set({ status, rejectionReason: rejectionReason || null })
    .where(eq(dailyReports.id, Number(id)))
    .returning();
  return Response.json(updated);
}
