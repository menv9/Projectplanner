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

  if (existingCount === 0) {
    const token = await signSession({ uid: user.id, username: user.username });
    await setSessionCookie(token);
  }
  return NextResponse.json(user, { status: 201 });
}
