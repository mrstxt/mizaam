import { db } from "@/db";
import { billingPayments, tenants } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const result = await db
    .select({
      id: billingPayments.id,
      tenantId: billingPayments.tenantId,
      amount: billingPayments.amount,
      plan: billingPayments.plan,
      paymentMethod: billingPayments.paymentMethod,
      status: billingPayments.status,
      invoiceNumber: billingPayments.invoiceNumber,
      paidAt: billingPayments.paidAt,
      createdAt: billingPayments.createdAt,
      tenantName: tenants.name,
      tenantDomain: tenants.domainPrefix,
    })
    .from(billingPayments)
    .innerJoin(tenants, eq(tenants.id, billingPayments.tenantId))
    .orderBy(desc(billingPayments.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [record] = await db.insert(billingPayments).values(body).returning();
  return Response.json(record, { status: 201 });
}
