import { db } from "@/db";
import { tasks, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { and, desc, eq } from "drizzle-orm";

const statuses = ["kutilmoqda", "bajarilmoqda", "bajarildi", "muddati_otgan"] as const;
const priorities = ["past", "orta", "yuqori", "kritik"] as const;

type TaskStatus = (typeof statuses)[number];
type TaskPriority = (typeof priorities)[number];

function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && statuses.includes(value as TaskStatus);
}
function isTaskPriority(value: unknown): value is TaskPriority {
  return typeof value === "string" && priorities.includes(value as TaskPriority);
}

export async function GET(request: Request) {
  const auth = await authorize(request, { panel: "tasks" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const priority = searchParams.get("priority");

  const conditions = [];
  if (isTaskStatus(status)) conditions.push(eq(tasks.status, status));
  if (isTaskPriority(priority)) conditions.push(eq(tasks.priority, priority));

  if (auth.user.role === "employee") {
    conditions.push(eq(tasks.assignedTo, auth.user.id));
  } else if (userId) {
    conditions.push(eq(tasks.assignedTo, Number(userId)));
  }

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
  const auth = await authorize(request, { roles: ["admin", "manager"], panel: "tasks" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const title = String(body.title || "").trim();
  const assignedTo = Number(body.assignedTo || 0);
  if (!title) return jsonError("Vazifa sarlavhasi majburiy", 400);
  if (!assignedTo) return jsonError("Vazifa uchun xodim tanlang", 400);

  const deadline = body.deadline ? new Date(body.deadline) : null;
  const [task] = await db
    .insert(tasks)
    .values({
      title,
      description: String(body.description || "").trim() || null,
      assignedTo,
      createdBy: auth.user.id,
      priority: isTaskPriority(body.priority) ? body.priority : "orta",
      status: isTaskStatus(body.status) ? body.status : "kutilmoqda",
      deadline,
      bonus: Number(body.bonus || 0),
    })
    .returning();

  return Response.json(task, { status: 201 });
}
