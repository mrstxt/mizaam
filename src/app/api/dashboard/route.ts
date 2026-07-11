import { db } from "@/db";
import { users, attendance, tasks, dailyReports, leads, activityLogs, salaryDistributions } from "@/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000);

  // Active tasks count
  const activeTasks = await db
    .select({ count: sql<number>`count(*)` })
    .from(tasks)
    .where(eq(tasks.status, "kutilmoqda"));

  // Pending reports count
  const pendingReports = await db
    .select({ count: sql<number>`count(*)` })
    .from(dailyReports)
    .where(eq(dailyReports.status, "kutilmoqda"));

  // Total employees
  const totalEmployees = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.status, "ishlaydi"));

  // Today attendance
  const todayAttendance = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(and(eq(attendance.date, today), eq(attendance.status, "keldi")));

  const todayLate = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(and(eq(attendance.date, today), eq(attendance.status, "kechikdi")));

  const todayAbsent = await db
    .select({ count: sql<number>`count(*)` })
    .from(attendance)
    .where(and(eq(attendance.date, today), eq(attendance.status, "kelmadi")));

  // 7-day attendance trend
  const attendanceTrend = await db
    .select({
      date: attendance.date,
      present: sql<number>`count(*) filter (where ${attendance.status} = 'keldi')`,
      late: sql<number>`count(*) filter (where ${attendance.status} = 'kechikdi')`,
      absent: sql<number>`count(*) filter (where ${attendance.status} = 'kelmadi')`,
    })
    .from(attendance)
    .where(gte(attendance.date, weekAgo.toISOString().split("T")[0]))
    .groupBy(attendance.date)
    .orderBy(attendance.date);

  // Top 5 employees by KPI
  const topEmployees = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      kpi: salaryDistributions.kpiBonus,
    })
    .from(salaryDistributions)
    .innerJoin(users, eq(users.id, salaryDistributions.userId))
    .orderBy(desc(salaryDistributions.kpiBonus))
    .limit(5);

  // Open leads by stage
  const leadsByStage = await db
    .select({
      stage: leads.stage,
      count: sql<number>`count(*)`,
    })
    .from(leads)
    .where(sql`${leads.stage} NOT IN ('golib', 'yutqazilgan')`)
    .groupBy(leads.stage);

  // SLA breached leads
  const slaBreached = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        sql`${leads.stage} NOT IN ('golib', 'yutqazilgan')`,
        sql`${leads.slaDeadline} < now()`
      )
    );

  // Won deals this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const wonDeals = await db
    .select({
      count: sql<number>`count(*)`,
      total: sql<number>`coalesce(sum(${leads.wonAmount}), 0)`,
    })
    .from(leads)
    .where(
      and(
        eq(leads.stage, "golib"),
        gte(leads.wonAt, thisMonth)
      )
    );

  // Conversion rate
  const totalLeads = await db.select({ count: sql<number>`count(*)` }).from(leads);
  const wonLeads = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(eq(leads.stage, "golib"));

  // Recent activities
  const recentActivities = await db
    .select({
      id: activityLogs.id,
      action: activityLogs.action,
      details: activityLogs.details,
      createdAt: activityLogs.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(activityLogs)
    .leftJoin(users, eq(users.id, activityLogs.userId))
    .orderBy(desc(activityLogs.createdAt))
    .limit(10);

  // Today attendance details
  const todayAttendanceDetails = await db
    .select({
      id: attendance.id,
      userId: attendance.userId,
      firstName: users.firstName,
      lastName: users.lastName,
      checkIn: attendance.checkIn,
      checkOut: attendance.checkOut,
      status: attendance.status,
    })
    .from(attendance)
    .innerJoin(users, eq(users.id, attendance.userId))
    .where(eq(attendance.date, today))
    .orderBy(attendance.checkIn);

  return Response.json({
    activeTasks: Number(activeTasks[0].count),
    pendingReports: Number(pendingReports[0].count),
    totalEmployees: Number(totalEmployees[0].count),
    todayPresent: Number(todayAttendance[0].count),
    todayLate: Number(todayLate[0].count),
    todayAbsent: Number(todayAbsent[0].count),
    attendanceTrend,
    topEmployees,
    leadsByStage,
    slaBreached: Number(slaBreached[0].count),
    wonDealsCount: Number(wonDeals[0].count),
    wonDealsTotal: Number(wonDeals[0].total),
    conversionRate: totalLeads[0].count > 0
      ? Math.round((Number(wonLeads[0].count) / Number(totalLeads[0].count)) * 100)
      : 0,
    recentActivities,
    todayAttendance: todayAttendanceDetails,
  });
}
