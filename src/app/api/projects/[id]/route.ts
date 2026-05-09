import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({ name: z.string().min(1).max(60).optional(), color: z.string().optional().nullable(), teamId: z.string().optional().nullable(), context: z.string().optional().nullable() });

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;

  const project = await prisma.project.findUnique({ where: { id: params.id } });
  if (!project) return bad("Not found", 404);

  // If project belongs to a team, verify access
  if (project.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId: auth.user.id } }
    });
    if (!member) return bad("Not found", 404);
  }

  return json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;
  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const d = parsed.data;
  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) return bad("Not found", 404);

  // If assigning to a team, verify the user is an admin of that team
  if (d.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: d.teamId, userId: auth.user.id } }
    });
    if (!member || member.role !== "admin") {
      return bad("Admin access to team required", 403);
    }
  }

  try {
    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.color !== undefined && { color: d.color }),
        ...(d.teamId !== undefined && { teamId: d.teamId }),
        ...(d.context !== undefined && { context: d.context })
      }
    });
    return json(project);
  } catch { return bad("Not found or name taken", 404); }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth(); if (auth.error) return auth.error;

  const existing = await prisma.project.findUnique({ where: { id: params.id } });
  if (!existing) return bad("Not found", 404);

  if (existing.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: existing.teamId, userId: auth.user.id } }
    });
    if (!member || member.role !== "admin") {
      return bad("Admin access required", 403);
    }
  }

  await prisma.project.delete({ where: { id: params.id } });
  return json({ ok: true });
}
