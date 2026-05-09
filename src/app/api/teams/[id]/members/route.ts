import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const AddMember = z.object({ username: z.string().min(1) });

async function requireTeamAdmin(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } }
  });
  if (!member) return { error: bad("Not a team member", 403) };
  if (member.role !== "admin") return { error: bad("Admin required", 403) };
  return { member };
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const admin = await requireTeamAdmin(params.id, auth.user.id);
  if (admin.error) return admin.error;

  const parsed = AddMember.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true, username: true }
  });
  if (!user) return bad("User not found", 404);

  try {
    const member = await prisma.teamMember.create({
      data: {
        teamId: params.id,
        userId: user.id,
        role: "member"
      },
      include: { user: { select: { id: true, username: true } } }
    });
    return json({
      id: member.id,
      userId: member.user.id,
      username: member.user.username,
      role: member.role
    }, { status: 201 });
  } catch {
    return bad("Already a member", 409);
  }
}
