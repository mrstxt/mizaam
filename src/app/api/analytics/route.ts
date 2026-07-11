import { db } from "@/db";
import { users, tasks, attendance, salaryDistributions, leads } from "@/db/schema";
import { eq, desc, sql, gte } from "drizzle-orm";

export async function GET() {
  // KPI distribution
  const kpiDist = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
      kpi: salaryDistributions.kpiBonus,
      bonus: salaryDistributions.bonus,
      fine: salaryDistributions.fine,
    })
    .from(salaryDistributions)
    .innerJoin(users, eq(users.id, salaryDistributions.userId))
    .orderBy(desc(salaryDistributions.kpiBonus));

  // Employee ranking
  const ranking = kpiDist.map((item, idx) => ({
    rank: idx + 1,
    name: `${item.firstName} ${item.lastName}`,
    kpi: item.kpi,
    recommendation: (item.kpi ?? 0) > 800000 ? "Lavozim ko'tarish" : (item.kpi ?? 0) < 300000 ? "Yordam kerak" : "Barqaror",
  }));

  // Attendance quality
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const attQuality = await db
    .select({
      present: sql<number>`count(*) filter (where ${attendance.status} = 'keldi')`,
      late: sql<number>`count(*) filter (where ${attendance.status} = 'kechikdi')`,
      absent: sql<number>`count(*) filter (where ${attendance.status} = 'kelmadi')`,
    })
    .from(attendance)
    .where(gte(attendance.date, thisMonth.toISOString().split("T")[0]));

  // Task completion stats
  const taskStats = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`count(*) filter (where ${tasks.status} = 'bajarildi')`,
      overdue: sql<number>`count(*) filter (where ${tasks.status} = 'muddati_otgan')`,
    })
    .from(tasks);

  // Lead conversion by stage
  const leadStages = await db
    .select({
      stage: leads.stage,
      count: sql<number>`count(*)`,
    })
    .from(leads)
    .groupBy(leads.stage);

  return Response.json({
    kpiDistribution: kpiDist,
    ranking,
    attendanceQuality: {
      present: Number(attQuality[0].present),
      late: Number(attQuality[0].late),
      absent: Number(attQuality[0].absent),
    },
    taskStats: {
      total: Number(taskStats[0].total),
      completed: Number(taskStats[0].completed),
      overdue: Number(taskStats[0].overdue),
    },
    leadStages,
  });
}
