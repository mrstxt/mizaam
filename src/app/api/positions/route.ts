import { db } from "@/db";
import { positions } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const result = await db.select().from(positions);
  return Response.json(result);
}

export async function POST(request: Request) {
  const auth = await authorize(request, { roles: ["admin", "manager"], panel: "employees" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const name = String(body.name || "").trim();
  if (!name) return jsonError("Lavozim nomi majburiy", 400);

  const [pos] = await db
    .insert(positions)
    .values({
      name,
      baseSalary: Number(body.baseSalary || 0),
      salaryType: body.salaryType || "oylik",
    })
    .returning();

  return Response.json(pos, { status: 201 });
}
