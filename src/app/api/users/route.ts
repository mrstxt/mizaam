import { db } from "@/db";
import { users, positions } from "@/db/schema";
import { eq, desc, sql, and, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const positionId = searchParams.get("positionId");

  const conditions = [];
  if (status) conditions.push(eq(users.status, status as "ishlaydi" | "ishdan_ketgan" | "damda"));
  if (positionId) conditions.push(eq(users.positionId, Number(positionId)));
  if (search) {
    conditions.push(
      sql`(${users.firstName} || ' ' || ${users.lastName}) ilike ${`%${search}%`}`
    );
  }

  const result = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      address: users.address,
      education: users.education,
      cardNumber: users.cardNumber,
      telegramLogin: users.telegramLogin,
      status: users.status,
      role: users.role,
      positionId: users.positionId,
      positionName: positions.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(positions, eq(positions.id, users.positionId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [user] = await db.insert(users).values(body).returning();
  return Response.json(user, { status: 201 });
}
