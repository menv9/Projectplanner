import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPin, isValidPin } from "@/lib/pin";
import { getCurrentUser, setSessionCookie, signSession } from "@/lib/auth";

const Body = z.object({
  username: z.string().min(2).max(40).regex(/^[A-Za-z0-9_.-]+$/),
  pin: z.string()
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  if (!isValidPin(parsed.data.pin))
    return NextResponse.json({ error: "PIN must be 4-8 digits" }, { status: 400 });

  const existingCount = await prisma.user.count();
  if (existingCount > 0) {
    const me = await getCurrentUser();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dup = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (dup) return NextResponse.json({ error: "Username already exists" }, { status: 409 });

  const user = await prisma.user.create({
    data: { username: parsed.data.username, pinHash: await hashPin(parsed.data.pin) },
    select: { id: true, username: true }
  });

  // Create default settings for the new user
  const priorities = [
    { name: "Low", rank: 1, color: "#6b7280" },
    { name: "Medium", rank: 2, color: "#f59e0b" },
    { name: "High", rank: 3, color: "#ef4444" }
  ];
  const statuses = [
    { name: "Todo", rank: 1, color: "#6b7280" },
    { name: "Doing", rank: 2, color: "#3b82f6" },
    { name: "Done", rank: 3, color: "#10b981" }
  ];
  const categories = [
    { name: "Frontend", color: "#7c5cff" },
    { name: "Backend", color: "#22c55e" },
    { name: "Design", color: "#ec4899" },
    { name: "Bug", color: "#ef4444" }
  ];

  for (const p of priorities) {
    await prisma.priority.create({ data: { ...p, ownerId: user.id } }).catch(() => {});
  }
  for (const s of statuses) {
    await prisma.status.create({ data: { ...s, ownerId: user.id } }).catch(() => {});
  }
  for (const c of categories) {
    await prisma.category.create({ data: { ...c, ownerId: user.id } }).catch(() => {});
  }
  await prisma.project.create({ data: { name: "Inbox", color: "#7c5cff", ownerId: user.id } }).catch(() => {});

  if (existingCount === 0) {
    const token = await signSession({ uid: user.id, username: user.username });
    await setSessionCookie(token);
  }
  return NextResponse.json(user, { status: 201 });
}
