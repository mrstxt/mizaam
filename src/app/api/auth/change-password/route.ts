import { db } from "@/db";
import { users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { hashPassword, isStrongEnoughPassword, verifyPassword } from "@/lib/password";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const oldPassword = String(body.oldPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!isStrongEnoughPassword(newPassword)) {
    return jsonError("Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak", 400);
  }

  const [user] = await db.select().from(users).where(eq(users.id, auth.user.id)).limit(1);
  if (!user) return jsonError("Foydalanuvchi topilmadi", 404);

  const oldPasswordOk = await verifyPassword(oldPassword, user.passwordHash);
  if (!oldPasswordOk) return jsonError("Eski parol noto'g'ri", 400);

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), mustChangePassword: false })
    .where(eq(users.id, auth.user.id));

  return Response.json({ ok: true });
}
