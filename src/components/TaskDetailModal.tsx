"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Save, Trash2, X } from "lucide-react";
import type { Category, Priority, Project, Status, Task, User } from "@/types";

type Opts = {
  projects: Project[];
  priorities: Priority[];
  statuses: Status[];
  categories: Category[];
  users: User[];
};

type Form = {
  title: string;
  projectId: string;
  authorId: string;
  priorityId: string;
  statusId: string;
  categoryId: string;
  dueDate: string;
  notes: string;
};

const toDateInput = (date: string | null) => {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
};

export function TaskDetailModal({
  task, opts, onOpenChange, onDeleted, onSaved
}: {
  task: Task | null;
  opts: Opts;
  onOpenChange: (v: boolean) => void;
  onDeleted: () => void;
  onSaved: (task: Task) => void;
}) {
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!task) {
      setForm(null);
      return;
    }
    setForm({
      title: task.title,
      projectId: task.project.id,
      authorId: task.author.id,
      priorityId: task.priority.id,
      statusId: task.status.id,
      categoryId: task.category?.id || "",
      dueDate: toDateInput(task.dueDate),
      notes: task.notes || ""
    });
    setError(null);
  }, [task]);

  if (!task || !form) return null;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm({ ...form, [key]: value });
  };

  const close = () => onOpenChange(false);

  const save = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          notes: form.notes.trim() || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          projectId: form.projectId,
          authorId: form.authorId,
          priorityId: form.priorityId,
          statusId: form.statusId,
          categoryId: form.categoryId || null
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save task");
      onSaved(data as Task);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save task");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this task permanently?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not delete task");
      onDeleted();
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete task");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close task editor"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        onClick={close}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-editor-title"
        className="paper-card relative z-[1] w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
        style={{ borderRadius: 0 }}
      >
        <div className="relative z-[1] flex items-start justify-between gap-4 border-b border-rule px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <div className="eyebrow mb-1">Edit task</div>
            <h2 id="task-editor-title" className="font-display text-[1.7rem] leading-[1.1] tracking-tightish break-words">
              {task.title}
            </h2>
          </div>
          <button type="button" className="btn-ghost shrink-0" onClick={close} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="relative z-[1] max-h-[calc(92vh-136px)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="eyebrow block mb-1">Title</span>
              <input className="input !text-[15px]" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </label>

            <Select label="Project" value={form.projectId} onChange={(v) => set("projectId", v)} options={opts.projects} />
            <Select label="Author" value={form.authorId} onChange={(v) => set("authorId", v)} options={opts.users.map((u) => ({ id: u.id, name: u.username }))} />
            <Select label="Priority" value={form.priorityId} onChange={(v) => set("priorityId", v)} options={opts.priorities} />
            <StatusPills value={form.statusId} onChange={(v) => set("statusId", v)} options={opts.statuses} />
            <Select label="Category" value={form.categoryId} onChange={(v) => set("categoryId", v)} options={opts.categories} emptyLabel="None" />

            <label className="block">
              <span className="eyebrow block mb-1">Due</span>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
            </label>

            <label className="block sm:col-span-2">
              <span className="eyebrow block mb-1">Notes</span>
              <textarea
                className="input min-h-[180px] !text-[14px]"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
          </div>
        </div>

        <footer className="relative z-[1] flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-cream/40 px-5 py-3 sm:px-6">
          <span className="eyebrow">
            Created {format(new Date(task.createdAt), "PP")} - last edit {format(new Date(task.updatedAt), "PP")}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {error && <span className="eyebrow text-vermilion">{error}</span>}
            <button type="button" className="btn" onClick={remove} disabled={busy}>
              <Trash2 size={14} /> Delete
            </button>
            <button type="button" className="btn-accent" onClick={save} disabled={busy}>
              <Save size={14} /> {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function StatusPills({
  value, onChange, options
}: {
  value: string;
  onChange: (value: string) => void;
  options: Status[];
}) {
  return (
    <div className="block min-w-0 sm:col-span-2">
      <span className="eyebrow block mb-2">Status</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              className="status-pill"
              data-active={active}
              style={!active && option.color ? { color: option.color, borderColor: option.color } : {}}
              onClick={() => onChange(option.id)}
            >
              {option.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Select({
  label, value, onChange, options, emptyLabel
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { id: string; name: string }[];
  emptyLabel?: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="eyebrow block mb-1">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
