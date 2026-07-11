import { db } from "@/db";
import { leads, leadNotes, users, lostReasons } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stage = searchParams.get("stage");
  const assignedTo = searchParams.get("assignedTo");

  const conditions = [];
  if (stage) conditions.push(eq(leads.stage, stage as "yangi_lid" | "boglanildi" | "qiziqish_bildirdi" | "taklif_yuborildi" | "muzokara" | "golib" | "yutqazilgan"));
  if (assignedTo) conditions.push(eq(leads.assignedTo, Number(assignedTo)));

  const result = await db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      source: leads.source,
      assignedTo: leads.assignedTo,
      stage: leads.stage,
      isDuplicateOf: leads.isDuplicateOf,
      slaDeadline: leads.slaDeadline,
      lostReason: leads.lostReason,
      wonAmount: leads.wonAmount,
      wonAt: leads.wonAt,
      lostAt: leads.lostAt,
      createdAt: leads.createdAt,
      assigneeFirstName: users.firstName,
      assigneeLastName: users.lastName,
    })
    .from(leads)
    .leftJoin(users, eq(users.id, leads.assignedTo))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(leads.createdAt));

  return Response.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  // Check for duplicates
  if (body.phone) {
    const [existing] = await db.select().from(leads).where(eq(leads.phone, body.phone));
    if (existing) {
      return Response.json({ error: "Duplicate", existingId: existing.id }, { status: 409 });
    }
  }
  const [lead] = await db.insert(leads).values(body).returning();
  return Response.json(lead, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, note, ...data } = body;

  if (data.stage === "golib") {
    data.wonAt = new Date();
  }
  if (data.stage === "yutqazilgan") {
    data.lostAt = new Date();
  }

  const [updated] = await db.update(leads).set(data).where(eq(leads.id, Number(id))).returning();

  // Add note if provided
  if (note && data.assignedTo) {
    await db.insert(leadNotes).values({
      leadId: Number(id),
      userId: data.assignedTo,
      content: note,
    });
  }

  return Response.json(updated);
}
