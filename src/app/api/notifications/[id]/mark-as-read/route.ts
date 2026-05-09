import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureAuth, json, bad } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const notification = await prisma.notification.findUnique({
    where: { id: params.id }
  });

  if (!notification) return bad("Notification not found", 404);
  if (notification.userId !== auth.user.id) return bad("Forbidden", 403);

  const updated = await prisma.notification.update({
    where: { id: params.id },
    data: { isRead: true }
  });

  return json(updated);
}
