import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAuth, json } from "@/lib/api";

export async function GET() {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const [count, notifications] = await Promise.all([
    prisma.notification.count({
      where: { userId: auth.user.id, isRead: false }
    }),
    prisma.notification.findMany({
      where: { userId: auth.user.id, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        message: true,
        type: true,
        createdAt: true,
        taskId: true
      }
    })
  ]);

  return json({ count, notifications });
}
