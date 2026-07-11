import { db } from "@/db";
import { supportTickets, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");

  const result = await db
    .select({
      id: supportTickets.id,
      userId: supportTickets.userId,
      subject: supportTickets.subject,
      message: supportTickets.message,
      status: supportTickets.status,
      response: supportTickets.response,
      createdAt: supportTickets.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(supportTickets)
    .innerJoin(users, eq(users.id, supportTickets.userId))
    .where(status ? eq(supportTickets.status, status as "ochiq" | "jarayonda" | "hal_qilindi") : undefined)
    .orderBy(desc(supportTickets.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [ticket] = await db.insert(supportTickets).values(body).returning();
  return Response.json(ticket, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, status, response } = body;
  const [updated] = await db
    .update(supportTickets)
    .set({ status, response })
    .where(eq(supportTickets.id, Number(id)))
    .returning();
  return Response.json(updated);
}
