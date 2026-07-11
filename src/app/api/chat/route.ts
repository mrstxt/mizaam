import { db } from "@/db";
import { chatMessages, users } from "@/db/schema";
import { eq, desc, and, or } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const otherUserId = searchParams.get("otherUserId");

  const conditions = [];
  if (userId && otherUserId) {
    conditions.push(
      or(
        and(eq(chatMessages.senderId, Number(userId)), eq(chatMessages.receiverId, Number(otherUserId))),
        and(eq(chatMessages.senderId, Number(otherUserId)), eq(chatMessages.receiverId, Number(userId)))
      )
    );
  } else if (userId) {
    conditions.push(
      or(eq(chatMessages.senderId, Number(userId)), eq(chatMessages.receiverId, Number(userId)))
    );
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
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(chatMessages.createdAt))
    .limit(100);

  const reversed = result.reverse();
  return Response.json(reversed);
}

export async function POST(request: Request) {
  const body = await request.json();
  const [msg] = await db.insert(chatMessages).values(body).returning();
  return Response.json(msg, { status: 201 });
}
