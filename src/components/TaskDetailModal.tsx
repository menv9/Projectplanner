"use client";
import type { Task } from "@/types";
import { Modal } from "./Modal";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

export function TaskDetailModal({
  task, onOpenChange, onDeleted
}: { task: Task | null; onOpenChange: (v: boolean) => void; onDeleted: () => void }) {
  if (!task) return null;

  const remove = async () => {
    if (!confirm("Delete this task permanently?")) return;
    const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted();
      onOpenChange(false);
    }
  };

  const due = task.dueDate ? new Date(task.dueDate) : null;

  return (
    <Modal
      open={!!task}
      onOpenChange={onOpenChange}
      title={task.title}
      footer={
        <>
          <span className="eyebrow">
            {format(new Date(task.createdAt), "PP")} - last edit {format(new Date(task.updatedAt), "PP")}
          </span>
          <button type="button" className="btn" onClick={remove}>
            <Trash2 size={14} /> Delete
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 border-y border-rule py-4">
          <Meta label="Project" value={task.project.name} />
          <Meta label="Author" value={`@${task.author.username}`} />
          <Meta label="Priority" value={task.priority.name} color={task.priority.color} />
          <Meta label="Status" value={task.status.name} color={task.status.color} />
          {task.category && <Meta label="Category" value={task.category.name} color={task.category.color} />}
          {due && <Meta label="Due" value={format(due, "EEE, MMM d yyyy")} />}
        </dl>

        {task.notes && (
          <div>
            <span className="eyebrow block mb-2">Notes</span>
            <p className="font-display text-[1.05rem] leading-[1.55] text-ink whitespace-pre-wrap break-words">
              {task.notes}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Meta({ label, value, color }: { label: string; value: string; color?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="eyebrow mb-1">{label}</dt>
      <dd className="text-sm text-ink inline-flex max-w-full items-center gap-1.5">
        {color && <span className="dot shrink-0" style={{ background: color }} />}
        <span className="truncate">{value}</span>
      </dd>
    </div>
  );
}
