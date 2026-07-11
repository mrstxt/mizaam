import { db } from "@/db";
import { lostReasons } from "@/db/schema";

export async function GET() {
  const result = await db.select().from(lostReasons);
  return Response.json(result);
}
