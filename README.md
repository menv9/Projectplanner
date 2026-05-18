# Project Planner

A multi-project task tracker built for a small team that wanted Linear's vibe without Linear's price tag. Kanban + filterable grid + per-project dashboards, all reactive, all themed.

## What it does

**Two ways to see your tasks.** Filterable table for triage, drag-and-drop Kanban for execution. Same data, switch on the fly.

**Per-project dashboards.** Each project gets its own overview — workload by assignee, status breakdown, what's overdue, what's next. Hide noisy projects from the dashboard with a toggle in settings.

**A two-step new-task modal that doesn't suck.** Basics first (title, project, assignee, priority, status, category, due date), notes after. Keeps the form short instead of dumping 12 fields at you.

**Notifications.** Bell in the header tells you when you've been assigned something or when a task you care about changed.

**Optimistic everything.** Every mutation — create, edit, drag, delete, settings changes — updates the UI instantly and rolls back if the server says no. Drag a card across the board and it just moves; no spinner, no flicker.

**Configurable taxonomies.** Projects, priorities, statuses, categories, and users are all editable in settings. Statuses double as Kanban columns.

**Username + PIN auth.** No email flows, no password resets, no SSO theater.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · Postgres · TanStack Query · @hello-pangea/dnd · Radix · Zod + react-hook-form

## Implementation notes

- The Kanban drag stays smooth even with optimistic reordering — took a few rounds of `React.memo` reference-equality fixes (see `StatusColumn`) and one weird CSS transform bug on the Done column.
- Status columns are user-defined, so the board adapts to whatever workflow you set up in settings instead of hardcoding "todo / doing / done".
- The dashboard auto-hides projects you've marked as archived/noisy, so it stays useful as the project list grows.
