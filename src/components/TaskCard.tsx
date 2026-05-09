"use client";
import { memo, useEffect, useState } from "react";
import type { Status, Task } from "@/types";
import { format } from "date-fns";
import { Archive, ArchiveRestore } from "lucide-react";

function StatusHoverTrigger({
  task,
  statuses,
  onUpdated
}: {
  task: Task;
  statuses: Status[];
  onUpdated?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [optimisticStatusId, setOptimisticStatusId] = useState<string | null>(null);

  const effectiveStatusId = optimisticStatusId ?? task.status.id;
  const effectiveStatus = statuses.find((s) => s.id === effectiveStatusId) || task.status;

  useEffect(() => {
    setOptimisticStatusId(null);
  }, [task.status.id]);

  const changeStatus = async (statusId: string) => {
    if (statusId === task.status.id) return;
    setOptimisticStatusId(statusId);
    setBusy(true);
    try {
      const r = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ statusId })
      });
      if (r.ok) {
        onUpdated?.();
      } else {
        setOptimisticStatusId(null);
      }
    } catch {
      setOptimisticStatusId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 w-6 z-20 group/status cursor-pointer">
      <div
        className="absolute left-0 top-0 bottom-0 w-[5px]"
        style={{ background: effectiveStatus.color || "transparent" }}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-150 bg-paper border border-rule shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] rounded-md py-1 min-w-[150px] max-h-60 overflow-y-auto z-30">
        {statuses.map((s) => (
          <button
            key={s.id}
            type="button"
            className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-black/5 disabled:opacity-50"
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); changeStatus(s.id); }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color || "#9a9081" }} />
            <span className={s.id === effectiveStatusId ? "font-semibold text-ink" : "text-ash"}>{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskCardInner({ task, statuses, onClick, onUpdated, onArchive, interactive = true }: {
  task: Task;
  statuses: Status[];
  onClick?: () => void;
  onUpdated?: () => void;
  onArchive?: (taskId: string, archive: boolean) => void;
  interactive?: boolean;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;

  const body = (
    <div className="relative z-[1] flex flex-col h-full gap-3">
      <header className="flex items-start justify-between gap-3">
        {onArchive && (
          <button
            type="button"
            className="text-ash hover:text-ink transition"
            title={task.archivedAt ? "Unarchive" : "Archive"}
            onClick={(e) => { e.stopPropagation(); onArchive(task.id, !task.archivedAt); }}
          >
            {task.archivedAt ? <ArchiveRestore size={13} /> : <Archive size={13} />}
          </button>
        )}
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
          {task.category && (
            <span className="chip">{task.category.name}</span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="eyebrow flex items-center gap-1">
            <span className="display-italic text-[13px] text-vermilion translate-y-[1px]">@</span>
            {task.author.username}
          </span>
          <span className="eyebrow inline-flex items-center gap-1.5">
            <span className="dot" style={{ background: task.priority.color || "#5a5247" }} />
            {task.priority.name}
          </span>
        </div>
      </footer>
    </div>
  );

  return (
    <div className="relative w-full">
      <StatusHoverTrigger task={task} statuses={statuses} onUpdated={onUpdated} />
      {interactive ? (
        <button
          onClick={onClick}
          className="paper-card text-left p-5 pl-6 w-full transition hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.25)] focus:outline-none focus:ring-2 focus:ring-black/20"
          style={{ borderRadius: 0 }}
        >
          {body}
        </button>
      ) : (
        <div
          onClick={onClick}
          className="paper-card text-left p-5 pl-6 w-full hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.25)]"
          style={{ borderRadius: 0 }}
          role="button"
          tabIndex={0}
        >
          {body}
        </div>
      )}
    </div>
  );
}

function TaskRowInner({ task, statuses, onClick, onUpdated, onArchive }: {
  task: Task;
  statuses: Status[];
  onClick?: () => void;
  onUpdated?: () => void;
  onArchive?: (taskId: string, archive: boolean) => void;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <div className="relative w-full">
      <StatusHoverTrigger task={task} statuses={statuses} onUpdated={onUpdated} />
      <button
        onClick={onClick}
        className="paper-card text-left px-3 py-2 pl-5 w-full transition hover:shadow-[0_8px_28px_-14px_rgba(0,0,0,0.22)] focus:outline-none focus:ring-2 focus:ring-black/20"
        style={{ borderRadius: 0 }}
      >
        <div className="relative z-[1] grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-2 md:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {task.category && <span className="chip">{task.category.name}</span>}
            </div>
            <h3 className="font-display text-[1.1rem] leading-snug tracking-tightish text-ink truncate">
              {task.title}
            </h3>
            {task.notes && (
              <p className="text-[12.5px] text-ash leading-relaxed truncate">
                {task.notes}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 md:justify-center">
            <div className="flex items-center gap-2">
              {onArchive && (
                <button
                  type="button"
                  className="text-ash hover:text-ink transition"
                  title={task.archivedAt ? "Unarchive" : "Archive"}
                  onClick={(e) => { e.stopPropagation(); onArchive(task.id, !task.archivedAt); }}
                >
                  {task.archivedAt ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                </button>
              )}
              {due && (
                <span className="numeral text-[11px] text-ash">
                  {format(due, "MMM dd").toUpperCase()}
                </span>
              )}
            </div>
            <span className="eyebrow flex items-center gap-1">
              <span className="display-italic text-[13px] text-vermilion translate-y-[1px]">@</span>
              {task.author.username}
            </span>
            <span className="eyebrow inline-flex items-center gap-1.5">
              <span className="dot" style={{ background: task.priority.color || "#5a5247" }} />
              {task.priority.name}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

export const TaskCard = memo(TaskCardInner);
export const TaskRow = memo(TaskRowInner);
