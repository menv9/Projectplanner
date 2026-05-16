"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Category, Priority, Project, Status, Task, User } from "@/types";
import { ArrowLeft, ArrowRight, RotateCcw, Check } from "lucide-react";

type Opts = {
  projects: Project[]; priorities: Priority[]; statuses: Status[]; categories: Category[]; users: User[];
};

type Form = {
  title: string;
  projectId: string;
  authorId: string;
  priorityId: string;
  statusId: string;
  categoryId: string;
  dueDate: string;
  location: string;
  notes: string;
};

const empty = (currentUserId: string, opts: Opts): Form => ({
  title: "",
  projectId: opts.projects[0]?.id || "",
  authorId: currentUserId,
  priorityId: opts.priorities[0]?.id || "",
  statusId: opts.statuses.find((s) => s.name.toLowerCase() !== "todo")?.id || opts.statuses[0]?.id || "",
  categoryId: "",
  dueDate: "",
  location: "",
  notes: ""
});

export function NewTaskPanel({
  opts, currentUserId, onCreated, ready, lockedProjectId, className, plain
}: {
  opts: Opts;
  currentUserId: string;
  onCreated: (task: Task) => void;
  ready: boolean;
  lockedProjectId: string | null;
  className?: string;
  plain?: boolean;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(empty(currentUserId, opts));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (lockedProjectId && form.projectId !== lockedProjectId) {
      setForm((f) => ({ ...f, projectId: lockedProjectId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedProjectId]);

  useEffect(() => {
    if (!ready) return;
    const seed = empty(currentUserId, opts);
    setForm((f) => ({
      ...f,
      projectId: f.projectId || lockedProjectId || seed.projectId,
      priorityId: f.priorityId || seed.priorityId,
      statusId: f.statusId || seed.statusId,
      authorId: f.authorId || seed.authorId
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, opts.projects.length, opts.priorities.length, opts.statuses.length]);

  const reset = () => {
    setStep(0);
    setForm({ ...empty(currentUserId, opts), projectId: lockedProjectId || opts.projects[0]?.id || "" });
    setError(null);
  };

  const canStep0 = form.title && form.projectId && form.authorId && form.priorityId && form.statusId;

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          notes: form.notes || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          projectId: form.projectId,
          authorId: form.authorId,
          priorityId: form.priorityId,
          statusId: form.statusId,
          categoryId: form.categoryId || null,
          location: form.location || null
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to create");
      const task: Task = await res.json();
      onCreated(task);
      reset();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1600);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const inner = (
    <div className="relative z-[1] flex flex-col">
      {!plain && (
        <header className="px-5 pt-5 pb-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-ash tracking-wide">New entry</span>
            <span className="numeral text-[11px] text-dust">{step + 1} / 2</span>
          </div>
          <h2 className="font-display text-[1.6rem] leading-[1] tracking-tightish mt-1">
            <span className="display-italic text-vermilion">Compose</span> a task
          </h2>
          <p className="text-[12.5px] text-ash mt-2 leading-snug">
            {step === 0 ? "Set the essentials. Title, who owns it, where it lives." : "Add the prose — context, links, anything worth remembering."}
          </p>
          <div className="progress-track mt-4">
            <div className="progress-fill" style={{ width: `${((step + 1) / 2) * 100}%` }} />
          </div>
        </header>
      )}

      <div className={`${plain ? "px-5 pt-4 pb-4" : "px-5 pb-4"} ${plain ? "" : "min-h-[280px]"}`}>
        {!ready ? (
          <p className="text-sm text-ash">
            Add a project, priority and status in <span className="display-italic">Settings</span> to begin.
          </p>
        ) : step === 0 ? (
          <StepBasics key="b" form={form} setForm={setForm} opts={opts} hideProject={!!lockedProjectId} />
        ) : (
          <StepDetails key="d" form={form} setForm={setForm} />
        )}
      </div>

      <footer className={`px-5 py-4 border-t border-rule/70 flex items-center justify-between gap-2 ${plain ? "" : "bg-cream/40"}`}>
        <div className="flex items-center gap-1">
          {step > 0 ? (
            <button className="btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              <ArrowLeft size={14} /> Back
            </button>
          ) : (
            (form.title || form.notes) && (
              <button className="btn-ghost" onClick={reset} disabled={busy}>
                <RotateCcw size={12} /> Reset
              </button>
            )
          )}
        </div>
        <div className="flex items-center gap-2">
          {success && <span className="eyebrow text-forest inline-flex items-center gap-1"><Check size={12} /> Saved</span>}
          {error && <span className="eyebrow text-vermilion">{error}</span>}
          {step < 1 ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)} disabled={!canStep0 || !ready}>
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn-accent" onClick={submit} disabled={busy || !ready}>
              {busy ? "Filing…" : "File task"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );

  if (plain) return inner;

  return (
    <aside className={`paper-card sticky top-6 h-fit ${className || ""}`}>
      {inner}
    </aside>
  );
}

function StepBasics({ form, setForm, opts, hideProject }: { form: Form; setForm: (f: Form) => void; opts: Opts; hideProject?: boolean }) {
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });
  return (
    <div className="space-y-4 rise-in">
      <NumberedField num="01" label="Title">
        <input
          className="input !text-[15px]"
          placeholder="What needs doing?"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
      </NumberedField>

      {!hideProject && (
        <NumberedField num="02" label="Project">
          <select className="input" value={form.projectId} onChange={(e) => set("projectId", e.target.value)}>
            {opts.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </NumberedField>
      )}

      <NumberedField num={hideProject ? "02" : "03"} label="Author">
        <select className="input" value={form.authorId} onChange={(e) => set("authorId", e.target.value)}>
          {opts.users.map((u) => <option key={u.id} value={u.id}>{u.username}</option>)}
        </select>
      </NumberedField>

      <div className="grid grid-cols-2 gap-3">
        <NumberedField num={hideProject ? "03" : "04"} label="Priority">
          <select className="input" value={form.priorityId} onChange={(e) => set("priorityId", e.target.value)}>
            {opts.priorities.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </NumberedField>
        <NumberedField num={hideProject ? "04" : "05"} label="Status">
          <select className="input" value={form.statusId} onChange={(e) => set("statusId", e.target.value)}>
            {opts.statuses.filter((s) => s.name.toLowerCase() !== "todo").map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </NumberedField>
        <NumberedField num={hideProject ? "05" : "06"} label="Category">
          <select className="input" value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
            <option value="">— none —</option>
            {opts.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </NumberedField>
        <NumberedField num={hideProject ? "06" : "07"} label="Due">
          <input type="date" className="input" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          {form.dueDate && (() => {
            const d = new Date(form.dueDate);
            return isNaN(d.getTime()) ? null : (
              <span className="block font-display italic text-[12.5px] text-ash mt-1">
                {format(d, "d MMMM, EEEE")}
              </span>
            );
          })()}
        </NumberedField>
        <NumberedField num={hideProject ? "07" : "08"} label="Task Page">
          <input
            className="input !text-[15px]"
            placeholder="Where will this take place?"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />
        </NumberedField>
      </div>
    </div>
  );
}

function StepDetails({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  return (
    <div className="rise-in">
      <NumberedField num="01" label="Notes">
        <textarea
          className="input min-h-[260px] !text-[14px]"
          placeholder="Write here. Links, references, the why behind it…"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
      </NumberedField>
    </div>
  );
}

function NumberedField({ num, label, children }: { num: string; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-2 mb-1.5">
        <span className="numeral text-vermilion text-[10.5px] font-medium">{num}</span>
        <span className="flex-1 h-px bg-rule/60 translate-y-[-3px]" />
        <span className="text-[11px] text-ash tracking-wide">{label}</span>
      </span>
      {children}
    </label>
  );
}
