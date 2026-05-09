import { bad, ensureAuth, json } from "@/lib/api";
import { prisma } from "@/lib/prisma";

async function requireTeamAdmin(teamId: string, userId: string) {
  const member = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } }
  });
  if (!member) return { error: bad("Not a team member", 403) };
  if (member.role !== "admin") return { error: bad("Admin required", 403) };
  return { member };
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
