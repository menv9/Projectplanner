import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";
import type { Prisma } from "@prisma/client";

const Create = z.object({
  title: z.string().min(1).max(200),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  projectId: z.string().min(1),
  authorId: z.string().min(1),
  priorityId: z.string().min(1),
  statusId: z.string().min(1),
  categoryId: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const sp = req.nextUrl.searchParams;
  const where: Prisma.TaskWhereInput = {};
  const set = (k: keyof Prisma.TaskWhereInput, v: string | null) => {
    if (v) (where as Record<string, unknown>)[k as string] = v;
  };
  set("projectId", sp.get("projectId"));
  set("priorityId", sp.get("priorityId"));
  set("statusId", sp.get("statusId"));
  set("authorId", sp.get("authorId"));
  set("categoryId", sp.get("categoryId"));
  const from = sp.get("from"), to = sp.get("to");
  if (from || to) {
    where.dueDate = {};
    if (from) (where.dueDate as Prisma.DateTimeFilter).gte = new Date(from);
    if (to) (where.dueDate as Prisma.DateTimeFilter).lte = new Date(to);
  }
  where.deletedAt = null;

  const archived = sp.get("archived");
  if (archived === "true") {
    where.archivedAt = { not: null };
  } else if (archived !== "include") {
    where.archivedAt = null;
  }

  const q = sp.get("q");
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } }
    ];
  }

  // Scope tasks to projects the user can access
  const memberships = await prisma.teamMember.findMany({
    where: { userId: auth.user.id },
    select: { teamId: true }
  });
  const teamIds = memberships.map((m) => m.teamId);

  const accessibleProjects = await prisma.project.findMany({
    where: {
      OR: [
        // Legacy public projects (no owner, no team)
        { ownerId: null, teamId: null },
        // Solo projects owned by current user
        { ownerId: auth.user.id, teamId: null },
        // Team projects
        { teamId: { in: teamIds } }
      ]
    },
    select: { id: true }
  });
  const accessibleProjectIds = accessibleProjects.map((p) => p.id);

  // If a specific projectId is requested, validate it and scope to that project only
  const requestedProjectId = sp.get("projectId");
  if (requestedProjectId) {
    if (!accessibleProjectIds.includes(requestedProjectId)) {
      return json([]);
    }
    where.projectId = requestedProjectId;
  } else {
    // No specific project requested — show tasks from all accessible projects
    where.projectId = { in: accessibleProjectIds };
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: true, author: { select: { id: true, username: true } },
      priority: true, status: true, category: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });
  return json(tasks);
}

export async function POST(req: NextRequest) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;
  const parsed = Create.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return bad("Invalid input");

  const data = parsed.data;

  // Verify the user can access the project
  const project = await prisma.project.findUnique({ where: { id: data.projectId } });
  if (!project) return bad("Project not found", 404);

  if (!project.ownerId && !project.teamId) {
    // Legacy public project — ok
  } else if (project.ownerId && !project.teamId) {
    if (project.ownerId !== auth.user.id) {
      return bad("Project access denied", 403);
    }
  } else if (project.teamId) {
    const member = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: project.teamId, userId: auth.user.id } }
    });
    if (!member) return bad("Project access denied", 403);
  }

  let title = data.title;
  let notes = data.notes || null;
  if (title.length > 70) {
    const rest = title.slice(67).trimStart();
    title = title.slice(0, 67).trimEnd() + "...";
    notes = notes ? rest + "\n\n" + notes : rest;
  }

  const task = await prisma.task.create({
    data: {
      title,
      notes,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: data.projectId,
      authorId: data.authorId,
      priorityId: data.priorityId,
      statusId: data.statusId,
      categoryId: data.categoryId || null
    },
    include: { project: true, priority: true, status: true, category: true, author: { select: { id: true, username: true } } }
  });

  // Create notifications for relevant users
  const authorId = data.authorId;
  let notifyUserIds: string[] = [];

  if (project.teamId) {
    const members = await prisma.teamMember.findMany({
      where: { teamId: project.teamId },
      select: { userId: true }
    });
    notifyUserIds = members.map((m) => m.userId).filter((id) => id !== authorId);
  } else if (project.ownerId && project.ownerId !== authorId) {
    notifyUserIds = [project.ownerId];
  } else if (!project.ownerId && !project.teamId) {
    // Legacy public project — notify all other users
    const allUsers = await prisma.user.findMany({ select: { id: true } });
    notifyUserIds = allUsers.map((u) => u.id).filter((id) => id !== authorId);
  }

  if (notifyUserIds.length > 0) {
    await prisma.notification.createMany({
      data: notifyUserIds.map((userId) => ({
        userId,
        taskId: task.id,
        message: `Nueva tarea '${task.title}' añadida`,
        type: "TASK_CREATED"
      }))
    });
  }

  return json(task, { status: 201 });
}
