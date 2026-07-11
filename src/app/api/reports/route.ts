import { db } from "@/db";
import { dailyReports, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

const statuses = ["kutilmoqda", "tasdiqlangan", "rad_etilgan"] as const;
type ReportStatus = (typeof statuses)[number];
function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === "string" && statuses.includes(value as ReportStatus);
}

export async function GET(request: Request) {
  const auth = await authorize(request, { panel: "reports" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const date = searchParams.get("date");

  const conditions = [];
  if (isReportStatus(status)) conditions.push(eq(dailyReports.status, status));
  if (date) conditions.push(eq(dailyReports.date, date));

  if (auth.user.role === "employee") {
    conditions.push(eq(dailyReports.userId, auth.user.id));
  } else if (userId) {
    conditions.push(eq(dailyReports.userId, Number(userId)));
  }

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
    .orderBy(desc(dailyReports.date), desc(dailyReports.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const auth = await authorize(request, { panel: "reports" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const content = String(body.content || "").trim();
  if (!content) return jsonError("Hisobot matni majburiy", 400);

  const date = String(body.date || new Date().toISOString().split("T")[0]);
  const userId = auth.user.role === "employee" ? auth.user.id : Number(body.userId || auth.user.id);

  const [report] = await db
    .insert(dailyReports)
    .values({ userId, date, content, status: "kutilmoqda" })
    .returning();

  return Response.json(report, { status: 201 });
}

export async function PUT(request: Request) {
  const auth = await authorize(request, { roles: ["admin", "manager"], panel: "reports" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const { id, rejectionReason } = body;
  const status = isReportStatus(body.status) ? body.status : null;
  if (!id || !status) return jsonError("Hisobot ID va status majburiy", 400);

  const [updated] = await db
    .update(dailyReports)
    .set({ status, rejectionReason: rejectionReason || null })
    .where(eq(dailyReports.id, Number(id)))
    .returning();

  return Response.json(updated);
}
