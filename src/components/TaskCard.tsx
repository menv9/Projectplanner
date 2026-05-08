"use client";
import type { Task } from "@/types";
import { format } from "date-fns";

export function TaskCard({ task, onClick }: { task: Task; onClick?: () => void }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <button
      onClick={onClick}
      className="paper-card text-left p-5 w-full transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-12px_rgba(26,20,16,0.25)] focus:outline-none focus:shadow-[0_0_0_2px_#1a1410]"
      style={{ borderRadius: 0, ...(task.status.color ? { borderLeft: `3px solid ${task.status.color}` } : {}) }}
    >
      <div className="relative z-[1] flex flex-col h-full gap-3">
        <header className="flex items-start justify-between gap-3">
          <span className="eyebrow inline-flex items-center gap-1.5">
            <span className="dot" style={{ background: task.priority.color || "#5a5247" }} />
            {task.priority.name}
          </span>
          {due && (
            <span className="numeral text-[11px] text-ash">
              {format(due, "MMM dd").toUpperCase()}
            </span>
          )}
        </header>

        <h3 className="font-display text-[1.35rem] leading-[1.15] tracking-tightish text-ink line-clamp-3">
          {task.title}
        </h3>

        {task.notes && (
          <p className="text-[13.5px] text-ash leading-relaxed line-clamp-3">
            {task.notes}
          </p>
        )}

        <footer className="mt-auto pt-3 border-t border-rule/70 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="status-pill" style={task.status.color ? { color: task.status.color, borderColor: task.status.color } : {}}>
              {task.status.name}
            </span>
            {task.category && (
              <span className="chip">{task.category.name}</span>
            )}
          </div>
          <span className="eyebrow flex items-center gap-1">
            <span className="display-italic text-[13px] text-vermilion translate-y-[1px]">@</span>
            {task.author.username}
          </span>
        </footer>
      </div>
    </button>
  );
}

export function TaskRow({ task, onClick }: { task: Task; onClick?: () => void }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <button
      onClick={onClick}
      className="paper-card text-left px-4 py-3 w-full transition hover:shadow-[0_8px_28px_-14px_rgba(26,20,16,0.22)] focus:outline-none focus:shadow-[0_0_0_2px_#1a1410]"
      style={{ borderRadius: 0, ...(task.status.color ? { borderLeft: `3px solid ${task.status.color}` } : {}) }}
    >
      <div className="relative z-[1] grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="status-pill" style={task.status.color ? { color: task.status.color, borderColor: task.status.color } : {}}>
              {task.status.name}
            </span>
            <span className="eyebrow inline-flex items-center gap-1.5">
              <span className="dot" style={{ background: task.priority.color || "#5a5247" }} />
              {task.priority.name}
            </span>
            {task.category && <span className="chip">{task.category.name}</span>}
          </div>
          <h3 className="font-display text-[1.1rem] leading-snug tracking-tightish text-ink truncate">
            {task.title}
          </h3>
          {task.notes && (
            <p className="text-[12.5px] text-ash leading-relaxed truncate mt-1">
              {task.notes}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:justify-end">
          {due && (
            <span className="numeral text-[11px] text-ash">
              {format(due, "MMM dd").toUpperCase()}
            </span>
          )}
          <span className="eyebrow flex items-center gap-1">
            <span className="display-italic text-[13px] text-vermilion translate-y-[1px]">@</span>
            {task.author.username}
          </span>
        </div>
      </div>
    </button>
  );
}
