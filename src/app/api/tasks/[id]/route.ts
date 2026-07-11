import { db } from "@/db";
import { tasks } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { and, eq } from "drizzle-orm";

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, { panel: "tasks" });
  if (auth.error) return auth.error;

  const { id } = await params;
  const taskId = Number(id);
  const body = await req.json();

  const [current] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
  if (!current) return jsonError("Vazifa topilmadi", 404);
  if (auth.user.role === "employee" && current.assignedTo !== auth.user.id) {
    return jsonError("Bu vazifani o'zgartirishga ruxsat yo'q", 403);
  }

  const updateValues: Partial<typeof tasks.$inferInsert> = {};

  if (isTaskStatus(body.status)) {
    updateValues.status = body.status;
    updateValues.completedAt = body.status === "bajarildi" ? new Date() : null;
  }

  if (auth.user.role !== "employee") {
    if (typeof body.title === "string") updateValues.title = body.title.trim();
    if (typeof body.description === "string") updateValues.description = body.description.trim() || null;
    if (Number(body.assignedTo || 0) > 0) updateValues.assignedTo = Number(body.assignedTo);
    if (isTaskPriority(body.priority)) updateValues.priority = body.priority;
    if (body.deadline !== undefined) updateValues.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.bonus !== undefined) updateValues.bonus = Number(body.bonus || 0);
  }

  if (Object.keys(updateValues).length === 0) return jsonError("Yangilash uchun ma'lumot yuborilmadi", 400);

  const [updated] = await db
    .update(tasks)
    .set(updateValues)
    .where(auth.user.role === "employee" ? and(eq(tasks.id, taskId), eq(tasks.assignedTo, auth.user.id)) : eq(tasks.id, taskId))
    .returning();

  return Response.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authorize(req, { roles: ["admin", "manager"], panel: "tasks" });
  if (auth.error) return auth.error;

  const { id } = await params;
  await db.delete(tasks).where(eq(tasks.id, Number(id)));
  return Response.json({ ok: true });
}
