import { db } from "@/db";
import { leads, leadNotes, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead] = await db
    .select({
      id: leads.id,
      name: leads.name,
      phone: leads.phone,
      source: leads.source,
      assignedTo: leads.assignedTo,
      stage: leads.stage,
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
    .where(eq(leads.id, Number(id)));

  if (!lead) return Response.json({ error: "Topilmadi" }, { status: 404 });

  const notes = await db
    .select({
      id: leadNotes.id,
      content: leadNotes.content,
      createdAt: leadNotes.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(leadNotes)
    .innerJoin(users, eq(users.id, leadNotes.userId))
    .where(eq(leadNotes.leadId, Number(id)))
    .orderBy(desc(leadNotes.createdAt));

  return Response.json({ ...lead, notes });
}
