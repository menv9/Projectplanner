import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({ name: z.string().min(1).max(60).optional() });

async function requireTeamAdmin(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } }
  });
  if (!member) return { error: bad("Not a team member", 403) };
  if (member.role !== "admin") return { error: bad("Admin required", 403) };
  return { member };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: params.id, userId: auth.user.id } },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, username: true } } }
          },
          projects: { select: { id: true, name: true } }
        }
      }
    }
  });

  if (!membership) return bad("Not found", 404);

  return json({
    id: membership.team.id,
    name: membership.team.name,
    role: membership.role,
    members: membership.team.members.map((tm) => ({
      id: tm.id,
      userId: tm.user.id,
      username: tm.user.username,
      role: tm.role
    })),
    projects: membership.team.projects
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const admin = await requireTeamAdmin(params.id, auth.user.id);
  if (admin.error) return admin.error;

  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const team = await prisma.team.update({
    where: { id: params.id },
    data: { ...(parsed.data.name && { name: parsed.data.name }) }
  });

  return json(team);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const admin = await requireTeamAdmin(params.id, auth.user.id);
  if (admin.error) return admin.error;

  await prisma.team.delete({ where: { id: params.id } });
  return json({ ok: true });
}
