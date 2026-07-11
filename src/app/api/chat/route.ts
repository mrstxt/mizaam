import { db } from "@/db";
import { chatMessages, users } from "@/db/schema";
import { authorize, jsonError } from "@/lib/auth";
import { and, desc, eq, or } from "drizzle-orm";

export async function GET(request: Request) {
  const auth = await authorize(request, { panel: "chat" });
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const otherUserId = Number(searchParams.get("otherUserId") || 0);

  const conditions = [];
  if (otherUserId > 0) {
    conditions.push(
      or(
        and(eq(chatMessages.senderId, auth.user.id), eq(chatMessages.receiverId, otherUserId)),
        and(eq(chatMessages.senderId, otherUserId), eq(chatMessages.receiverId, auth.user.id))
      )
    );
  } else {
    conditions.push(or(eq(chatMessages.senderId, auth.user.id), eq(chatMessages.receiverId, auth.user.id)));
  }

  const result = await db
    .select({
      id: chatMessages.id,
      senderId: chatMessages.senderId,
      receiverId: chatMessages.receiverId,
      message: chatMessages.message,
      isRead: chatMessages.isRead,
      createdAt: chatMessages.createdAt,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
    })
    .from(chatMessages)
    .leftJoin(users, eq(users.id, chatMessages.senderId))
    .where(and(...conditions))
    .orderBy(desc(chatMessages.createdAt))
    .limit(100);

  return Response.json(result.reverse());
}

export async function POST(request: Request) {
  const auth = await authorize(request, { panel: "chat" });
  if (auth.error) return auth.error;

  const body = await request.json();
  const receiverId = Number(body.receiverId || 0);
  const message = String(body.message || "").trim();

  if (!receiverId || receiverId === auth.user.id) return jsonError("Qabul qiluvchi xodimni tanlang", 400);
  if (!message) return jsonError("Xabar matni bo'sh bo'lmasin", 400);

  const [msg] = await db
    .insert(chatMessages)
    .values({ senderId: auth.user.id, receiverId, message })
    .returning();

  return Response.json(msg, { status: 201 });
}
