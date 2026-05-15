import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const Patch = z.object({
  title: z.string().min(1).max(200).optional(),
  notes: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  projectId: z.string().optional(),
  authorId: z.string().optional(),
  priorityId: z.string().optional(),
  statusId: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  archived: z.boolean().optional(),
  attention: z.boolean().optional(),
  attentionNote: z.string().nullable().optional()
});

const include = {
  project: true, priority: true, status: true, category: true,
  author: { select: { id: true, username: true } }
} as const;

async function canAccessTask(taskId: string, userId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { project: true }
  });
  if (!task) return { task: null, ok: false };

  const project = task.project;

  // Legacy public project (no owner, no team)
  if (!project.ownerId && !project.teamId) return { task, ok: true };

  // Solo project — only owner can access
  if (project.ownerId && !project.teamId) {
    return { task, ok: project.ownerId === userId };
  }

  // Team project — check membership
  if (project.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId } }
    });
    return { task, ok: !!member };
  }

  return { task, ok: false };
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const { task, ok } = await canAccessTask(params.id, auth.user.id);
  if (!ok) return bad("Not found", 404);
  const t = await prisma.task.findUnique({ where: { id: params.id }, include });
  return json(t);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const { task: prev, ok } = await canAccessTask(params.id, auth.user.id);
  if (!ok || !prev) return bad("Not found", 404);

  const parsed = Patch.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");
  const d = parsed.data;

  // If moving to a different project, check access to the new project
  if (d.projectId) {
    const newProject = await prisma.project.findUnique({ where: { id: d.projectId } });
    if (!newProject) return bad("Project not found", 404);

    // Legacy public project
    if (!newProject.ownerId && !newProject.teamId) {
      // ok
    } else if (newProject.ownerId && !newProject.teamId) {
      if (newProject.ownerId !== auth.user.id) {
        return bad("Project access denied", 403);
      }
    } else if (newProject.teamId) {
      const member = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: newProject.teamId, userId: auth.user.id } }
      });
      if (!member) return bad("Project access denied", 403);
    }
  }

  const t = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...(d.title !== undefined && { title: d.title }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.dueDate !== undefined && { dueDate: d.dueDate ? new Date(d.dueDate) : null }),
      ...(d.projectId !== undefined && { projectId: d.projectId }),
      ...(d.authorId !== undefined && { authorId: d.authorId }),
      ...(d.priorityId !== undefined && { priorityId: d.priorityId }),
      ...(d.statusId !== undefined && { statusId: d.statusId }),
      ...(d.categoryId !== undefined && { categoryId: d.categoryId }),
      ...(d.location !== undefined && { location: d.location }),
      ...(d.archived !== undefined && { archivedAt: d.archived ? new Date() : null }),
      ...(d.attention !== undefined && { attention: d.attention }),
      ...(d.attentionNote !== undefined && { attentionNote: d.attentionNote })
    },
    include
  });

  // Notify on attention flag transition (false -> true)
  if (d.attention === true && prev.attention === false) {
    const project = prev.project;
    const noteSuffix = t.attentionNote ? `: "${t.attentionNote}"` : "";
    const message = `'${t.title}' marcada como atención${noteSuffix}`;
    let notifyUserIds: string[] = [];

    if (project.teamId) {
      const members = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true }
      });
      notifyUserIds = members.map((m) => m.userId).filter((id) => id !== auth.user.id);
    } else if (project.ownerId && project.ownerId !== auth.user.id) {
      notifyUserIds = [project.ownerId];
    } else if (!project.ownerId && !project.teamId) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      notifyUserIds = allUsers.map((u) => u.id).filter((id) => id !== auth.user.id);
    }

    if (notifyUserIds.length > 0) {
      const muted = await prisma.mutedProject.findMany({
        where: { projectId: prev.projectId, userId: { in: notifyUserIds } },
        select: { userId: true }
      });
      const mutedUserIds = new Set(muted.map((m) => m.userId));
      const filteredIds = notifyUserIds.filter((id) => !mutedUserIds.has(id));

      if (filteredIds.length > 0) {
        await prisma.notification.createMany({
          data: filteredIds.map((userId) => ({
            userId,
            taskId: t.id,
            message,
            type: "TASK_ATTENTION"
          }))
        });
      }
    }
  }

  // Notify on status transition to "Done"
  if (
    d.statusId !== undefined &&
    d.statusId !== prev.statusId &&
    t.status.name.toLowerCase() === "done"
  ) {
    const project = prev.project;
    const message = `'${t.title}' marcada como hecha`;
    let notifyUserIds: string[] = [];

    if (project.teamId) {
      const members = await prisma.teamMember.findMany({
        where: { teamId: project.teamId },
        select: { userId: true }
      });
      notifyUserIds = members.map((m) => m.userId).filter((id) => id !== auth.user.id);
    } else if (project.ownerId && project.ownerId !== auth.user.id) {
      notifyUserIds = [project.ownerId];
    } else if (!project.ownerId && !project.teamId) {
      const allUsers = await prisma.user.findMany({ select: { id: true } });
      notifyUserIds = allUsers.map((u) => u.id).filter((id) => id !== auth.user.id);
    }

    if (notifyUserIds.length > 0) {
      const muted = await prisma.mutedProject.findMany({
        where: { projectId: prev.projectId, userId: { in: notifyUserIds } },
        select: { userId: true }
      });
      const mutedUserIds = new Set(muted.map((m) => m.userId));
      const filteredIds = notifyUserIds.filter((id) => !mutedUserIds.has(id));

      if (filteredIds.length > 0) {
        await prisma.notification.createMany({
          data: filteredIds.map((userId) => ({
            userId,
            taskId: t.id,
            message,
            type: "TASK_DONE"
          }))
        });
      }
    }
  }

  return json(t);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const { ok } = await canAccessTask(params.id, auth.user.id);
  if (!ok) return bad("Not found", 404);

  await prisma.task.update({
    where: { id: params.id },
    data: { deletedAt: new Date() }
  });
  return json({ ok: true });
}
