import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPin } from "@/lib/pin";
import { setSessionCookie, signSession } from "@/lib/auth";

const Body = z.object({ username: z.string().min(1), pin: z.string().min(4).max(8) });

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPin(parsed.data.pin, user.pinHash);
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signSession({ uid: user.id, username: user.username });
  await setSessionCookie(token);
  return NextResponse.json({ id: user.id, username: user.username });
}
