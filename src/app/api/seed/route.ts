import { seed } from "@/db/seed";

export async function GET(request: Request) {
  const seedToken = process.env.SEED_TOKEN;
  const token = new URL(request.url).searchParams.get("token") || request.headers.get("x-seed-token");

  if (seedToken && token !== seedToken) {
    return Response.json({ ok: false, error: "Seed token noto'g'ri" }, { status: 401 });
  }

  try {
    await seed();
    return Response.json({
      ok: true,
      message: "Seed completed",
      demoLogins: {
        admin: "admin / Admin12345!",
        hr: "hr / Hr12345!",
        employee: "xodim / Xodim12345!",
      },
    });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
