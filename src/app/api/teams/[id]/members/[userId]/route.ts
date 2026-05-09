import { NextRequest } from "next/server";
import { z } from "zod";
import { bad, ensureAuth, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const PatchRole = z.object({ role: z.enum(["admin", "member"]) });

async function requireTeamAdmin(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } }
  });
  if (!member) return { error: bad("Not a team member", 403) };
  if (member.role !== "admin") return { error: bad("Admin required", 403) };
  return { member };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const admin = await requireTeamAdmin(params.id, auth.user.id);
  if (admin.error) return admin.error;

  const parsed = PatchRole.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  await prisma.teamMember.updateMany({
    where: { teamId: params.id, userId: params.userId },
    data: { role: parsed.data.role }
  });

  return json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string; userId: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const isSelf = params.userId === auth.user.id;
  if (!isSelf) {
    const admin = await requireTeamAdmin(params.id, auth.user.id);
    if (admin.error) return admin.error;
  }

  await prisma.teamMember.deleteMany({
    where: { teamId: params.id, userId: params.userId }
  });

  return json({ ok: true });
}
