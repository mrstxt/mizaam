import { db } from "@/db";
import {
  tenants,
  billingPayments,
  platformUpdates,
  platformMetrics,
  users,
} from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";

export async function GET() {
  // Total Tenants
  const totalTenants = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants);

  // Active Tenants
  const activeTenants = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants)
    .where(eq(tenants.status, "active"));

  // Trial Tenants
  const trialTenants = await db
    .select({ count: sql<number>`count(*)` })
    .from(tenants)
    .where(eq(tenants.status, "trial"));

  // Total MRR (Monthly Recurring Revenue)
  const mrrResult = await db
    .select({
      total: sql<number>`coalesce(sum(${tenants.monthlyFee}), 0)`,
    })
    .from(tenants)
    .where(eq(tenants.status, "active"));

  // Total End Users Across All Tenants
  const totalEmployees = await db
    .select({
      total: sql<number>`coalesce(sum(${tenants.employeeCount}), 0)`,
    })
    .from(tenants);

  // Recent Payments
  const recentPayments = await db
    .select({
      id: billingPayments.id,
      tenantId: billingPayments.tenantId,
      amount: billingPayments.amount,
      plan: billingPayments.plan,
      paymentMethod: billingPayments.paymentMethod,
      status: billingPayments.status,
      invoiceNumber: billingPayments.invoiceNumber,
      paidAt: billingPayments.paidAt,
      tenantName: tenants.name,
    })
    .from(billingPayments)
    .innerJoin(tenants, eq(tenants.id, billingPayments.tenantId))
    .orderBy(desc(billingPayments.createdAt))
    .limit(10);

  // Platform Metrics
  const [metrics] = await db
    .select()
    .from(platformMetrics)
    .orderBy(desc(platformMetrics.createdAt))
    .limit(1);

  // All Tenants list
  const allTenants = await db
    .select()
    .from(tenants)
    .orderBy(desc(tenants.createdAt));

  // Plan Breakdown
  const planBreakdown = await db
    .select({
      plan: tenants.plan,
      count: sql<number>`count(*)`,
    })
    .from(tenants)
    .groupBy(tenants.plan);

  return Response.json({
    totalTenants: Number(totalTenants[0].count),
    activeTenants: Number(activeTenants[0].count),
    trialTenants: Number(trialTenants[0].count),
    mrr: Number(mrrResult[0].total),
    totalEmployees: Number(totalEmployees[0].total),
    recentPayments,
    metrics: metrics || {
      cpuUsage: 18.4,
      ramUsage: 42.1,
      dbSizeMb: 256.8,
      activeBotsCount: 18,
      totalApiRequests: 384590,
    },
    allTenants,
    planBreakdown,
  });
}
