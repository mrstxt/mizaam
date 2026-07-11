import { db } from "@/db";
import { attendance, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { and, desc, eq, gte } from "drizzle-orm";

const statuses = ["keldi", "kechikdi", "kelmadi"] as const;
type AttendanceStatus = (typeof statuses)[number];
function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && statuses.includes(value as AttendanceStatus);
}

export async function GET(request: Request) {
  const auth = await authorize(request, { panel: "attendance" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const userId = searchParams.get("userId");
  const days = searchParams.get("days");

  const conditions = [];
  if (date) conditions.push(eq(attendance.date, date));
  if (auth.user.role === "employee") {
    conditions.push(eq(attendance.userId, auth.user.id));
  } else if (userId) {
    conditions.push(eq(attendance.userId, Number(userId)));
  }
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
  const auth = await authorize(request, { panel: "attendance" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const userId = auth.user.role === "employee" ? auth.user.id : Number(body.userId || 0);
  const date = String(body.date || new Date().toISOString().split("T")[0]);
  if (!userId) return jsonError("Xodim tanlang", 400);

  const [record] = await db
    .insert(attendance)
    .values({
      userId,
      date,
      checkIn: body.checkIn ? new Date(body.checkIn) : null,
      checkOut: body.checkOut ? new Date(body.checkOut) : null,
      status: isAttendanceStatus(body.status) ? body.status : "keldi",
      reason: String(body.reason || "").trim() || null,
    })
    .returning();

  return Response.json(record, { status: 201 });
}
