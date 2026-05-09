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
        taskId: true,
        task: { select: { projectId: true } }
      }
    })
  ]);

  const mapped = notifications.map((n) => ({
    id: n.id,
    message: n.message,
    type: n.type,
    createdAt: n.createdAt,
    taskId: n.taskId,
    projectId: n.task?.projectId ?? null
  }));

  return json({ count, notifications: mapped });
}
