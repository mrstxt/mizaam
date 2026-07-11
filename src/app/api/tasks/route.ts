import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const priority = searchParams.get("priority");

  const conditions = [];
  if (status) conditions.push(eq(tasks.status, status as "kutilmoqda" | "bajarilmoqda" | "bajarildi" | "muddati_otgan"));
  if (userId) conditions.push(eq(tasks.assignedTo, Number(userId)));
  if (priority) conditions.push(eq(tasks.priority, priority as "past" | "orta" | "yuqori" | "kritik"));

  const result = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      assignedTo: tasks.assignedTo,
      createdBy: tasks.createdBy,
      priority: tasks.priority,
      status: tasks.status,
      deadline: tasks.deadline,
      bonus: tasks.bonus,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      assigneeFirstName: users.firstName,
      assigneeLastName: users.lastName,
    })
    .from(tasks)
    .innerJoin(users, eq(users.id, tasks.assignedTo))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [task] = await db.insert(tasks).values(body).returning();
  return Response.json(task, { status: 201 });
}
