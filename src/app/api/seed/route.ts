import { seed } from "@/db/seed";

export async function GET() {
  try {
    await seed();
    return Response.json({ ok: true, message: "Seed completed" });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
