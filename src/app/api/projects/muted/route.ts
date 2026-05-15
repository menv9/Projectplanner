import { prisma } from "@/lib/prisma";
import { ensureAuth, json } from "@/lib/api";

export async function GET() {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const muted = await prisma.mutedProject.findMany({
    where: { userId: auth.user.id },
    select: { projectId: true }
  });

  return json(muted.map((m) => m.projectId));
}
