import { db } from "@/db";
import { salaryDistributions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  const userId = searchParams.get("userId");

  const result = await db
    .select({
      id: salaryDistributions.id,
      userId: salaryDistributions.userId,
      month: salaryDistributions.month,
      baseSalary: salaryDistributions.baseSalary,
      bonus: salaryDistributions.bonus,
      kpiBonus: salaryDistributions.kpiBonus,
      fine: salaryDistributions.fine,
      total: salaryDistributions.total,
      cardNumber: salaryDistributions.cardNumber,
      paidAt: salaryDistributions.paidAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(salaryDistributions)
    .innerJoin(users, eq(users.id, salaryDistributions.userId))
    .where(
      month
        ? eq(salaryDistributions.month, month)
        : userId
          ? eq(salaryDistributions.userId, Number(userId))
          : undefined
    )
    .orderBy(desc(salaryDistributions.month));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [record] = await db.insert(salaryDistributions).values(body).returning();
  return Response.json(record, { status: 201 });
}
