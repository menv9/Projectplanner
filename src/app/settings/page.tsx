"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Bell, BellOff, Copy, FileText, Pencil, Trash2, X, Users, Plus, UserPlus, UserX, Check } from "lucide-react";
import type { Category, Priority, Project, Status, Team, User } from "@/types";
import { CONTEXT_BOOTSTRAP_PROMPT } from "@/lib/contextPrompt";

const fetchJson = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function SettingsPage() {
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchJson<User>("/api/auth/me") });
  const canManageUsers = me.data && ["eris", "gorka"].includes(me.data.username.toLowerCase());

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-paper/60 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-6 sm:px-8 py-5 flex items-end justify-between gap-6">
          <div>
            <span className="text-[11px] text-ash tracking-wide block mb-1">Appendix · Configuration</span>
            <h1 className="font-display text-[2.2rem] leading-[0.95] tracking-tightish">
              <span className="display-italic text-vermilion">Settings</span>
            </h1>
          </div>
          <Link href="/" className="btn"><ArrowLeft size={14} /> Back</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-8 py-10 space-y-8">
        <ProjectsSection />
        <Section<Priority>
          n="02"
          title="Priorities"
          subtitle="Order what matters most. Lower rank shows first."
          endpoint="/api/priorities"
          queryKey="priorities"
          fields={[
            { name: "name", placeholder: "Priority name", required: true },
            { name: "rank", placeholder: "Rank (number)", type: "number" },
            { name: "color", placeholder: "#hex", type: "color" }
          ]}
        />
        <Section<Status>
          n="03"
          title="Statuses"
          subtitle="The columns of progress. To do, doing, done — or whatever you like."
          endpoint="/api/statuses"
          queryKey="statuses"
          fields={[
            { name: "name", placeholder: "Status name", required: true },
            { name: "rank", placeholder: "Rank (number)", type: "number" },
            { name: "color", placeholder: "#hex", type: "color" }
          ]}
        />
        <Section<Category>
          n="04"
          title="Categories"
          subtitle="A flexible second tag for grouping work across projects."
          endpoint="/api/categories"
          queryKey="categories"
          fields={[{ name: "name", placeholder: "Category name", required: true }, { name: "color", placeholder: "#hex", type: "color" }]}
        />
        <TeamsSection />
        {canManageUsers && <UsersSection />}
      </main>
    </div>
  );
}

function ProjectsSection() {
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => fetchJson<Project[]>("/api/projects") });
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => fetchJson<Team[]>("/api/teams") });
  const mutedIds = useQuery({ queryKey: ["mutedProjects"], queryFn: () => fetchJson<string[]>("/api/projects/muted") });
  const [draft, setDraft] = useState({ name: "", color: "" });
  const [error, setError] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [contextDraft, setContextDraft] = useState("");
  const [contextSaving, setContextSaving] = useState(false);
  const [contextPromptCopied, setContextPromptCopied] = useState(false);

  const copyContextPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CONTEXT_BOOTSTRAP_PROMPT);
      setContextPromptCopied(true);
      setTimeout(() => setContextPromptCopied(false), 1500);
    } catch {
      // silently fail
    }
  };

  const saveContext = async () => {
    if (!editingContext) return;
    setContextSaving(true);
    const res = await fetch(`/api/projects/${editingContext}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context: contextDraft.trim() || null })
    });
    setContextSaving(false);
    if (!res.ok) { alert("Failed to save context"); return; }
    setEditingContext(null);
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const add = async () => {
    setError(null);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: draft.name, color: draft.color || null })
    });
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    setDraft({ name: "", color: "" });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const assignTeam = async (projectId: string, teamId: string | null) => {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ teamId })
    });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const toggleMute = async (projectId: string, currentlyMuted: boolean) => {
    await fetch(`/api/projects/${projectId}/mute`, { method: currentlyMuted ? "DELETE" : "POST" });
    qc.invalidateQueries({ queryKey: ["mutedProjects"] });
  };

  const mutedSet = new Set(mutedIds.data || []);
  const adminTeamIds = new Set(teams.data?.filter((t) => t.role === "admin").map((t) => t.id) || []);

  return (
    <section className="bg-cream/60 border border-rule rounded-md overflow-hidden">
      <header className="px-6 pt-5 pb-4 border-b border-rule">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="numeral text-vermilion text-[11px]">01</span>
          <h2 className="font-display text-[1.5rem] leading-[1.05] tracking-tightish">Projects</h2>
        </div>
        <p className="text-sm text-ash">Each project becomes its own tab on the workshop floor.</p>
      </header>

      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] text-ash block mb-1">Project name</span>
            <input className="input" placeholder="Project name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-[11px] text-ash block mb-1">Color</span>
            <input className="input" type="color" value={draft.color} onChange={(e) => setDraft({ ...draft, color: e.target.value })} />
          </label>
        </div>
        <button className="btn-primary md:self-end" onClick={add}>Add entry</button>
        {error && <span className="text-sm text-vermilion col-span-full">{error}</span>}
      </div>

      <ul className="divide-y divide-rule">
        {projects.data?.length === 0 && (
          <li className="px-6 py-6 text-sm text-ash">Nothing here yet.</li>
        )}
        {projects.data?.map((it) => (
          <li key={it.id}>
            {editingContext === it.id ? (
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1.05rem]">{it.name} — Context</span>
                  <div className="flex gap-2">
                    <button
                      className="btn-ghost"
                      onClick={copyContextPrompt}
                      title="Copy a prompt to paste into an AI — it will analyse your codebase and produce a context document"
                    >
                      {contextPromptCopied ? <Check size={13} /> : <Copy size={13} />}
                      {contextPromptCopied ? "Copied" : "Copy context prompt"}
                    </button>
                    <button className="btn-primary !py-1 !px-3 text-xs" onClick={saveContext} disabled={contextSaving}>
                      {contextSaving ? "Saving…" : "Save"}
                    </button>
                    <button className="btn-ghost" onClick={() => setEditingContext(null)} disabled={contextSaving}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-ash">Used by the prompt generator to keep suggestions grounded — list real file names, components, conventions.</p>
                <textarea
                  className="input min-h-[140px] !text-[13px]"
                  placeholder={"## Stack\nNext.js 14, Prisma, Tailwind\n\n## Key files / components\nsrc/components/TaskDetailModal.tsx — task editor\nsrc/components/ProjectFilters.tsx — project filter bar\n\n## Conventions\n- RSC by default, 'use client' when needed"}
                  value={contextDraft}
                  onChange={(e) => setContextDraft(e.target.value)}
                />
              </div>
            ) : (
              <div className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {it.color && <span className="w-3.5 h-3.5 rounded-full border border-rule flex-shrink-0" style={{ background: it.color }} />}
                  <span className="font-display text-[1.05rem] truncate">{it.name}</span>
                  {it.context && <span className="chip !py-0 !px-1.5 text-[9px]"><FileText size={10} /></span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {teams.data && teams.data.length > 0 && (
                    <select
                      className="input py-1.5 text-xs"
                      value={it.teamId || ""}
                      onChange={(e) => assignTeam(it.id, e.target.value || null)}
                      disabled={it.teamId ? !adminTeamIds.has(it.teamId) : false}
                    >
                      <option value="">No team</option>
                      {teams.data
                        .filter((t) => !it.teamId || adminTeamIds.has(t.id) || t.id === it.teamId)
                        .map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                  )}
                  <button
                    className="btn-ghost"
                    onClick={() => { setEditingContext(it.id); setContextDraft(it.context || ""); }}
                  >
                    <FileText size={13} /> {it.context ? "Context" : "Add context"}
                  </button>
                  <button
                    className={`btn-ghost ${mutedSet.has(it.id) ? "text-ash" : ""}`}
                    onClick={() => toggleMute(it.id, mutedSet.has(it.id))}
                    title={mutedSet.has(it.id) ? "Unmute notifications" : "Mute notifications"}
                  >
                    {mutedSet.has(it.id) ? <BellOff size={13} /> : <Bell size={13} />}
                    {mutedSet.has(it.id) ? "Muted" : "Mute"}
                  </button>
                  <button className="btn-ghost text-vermilion" onClick={() => del(it.id)}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

type FieldDef = { name: string; placeholder: string; type?: string; required?: boolean };

function Section<T extends { id: string; name: string; color?: string | null; rank?: number; context?: string | null }>({
  n, title, subtitle, endpoint, queryKey, fields
}: { n: string; title: string; subtitle: string; endpoint: string; queryKey: string; fields: FieldDef[] }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: [queryKey], queryFn: () => fetchJson<T[]>(endpoint) });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [editingContext, setEditingContext] = useState<string | null>(null);
  const [contextDraft, setContextDraft] = useState("");

  const add = async () => {
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const v = draft[f.name];
      if (v == null || v === "") continue;
      body[f.name] = f.type === "number" ? Number(v) : v;
    }
    const res = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    setDraft({});
    qc.invalidateQueries({ queryKey: [queryKey] });
  };
  const del = async (id: string) => {
    if (!confirm("Delete?")) return;
    const res = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    if (res.status === 409 && queryKey === "statuses" && q.data) {
      const others = q.data.filter((x) => x.id !== id);
      if (others.length === 0) { alert("Status is in use and there's no other status to reassign tasks to."); return; }
      const list = others.map((o, i) => `${i + 1}. ${o.name}`).join("\n");
      const answer = window.prompt(`This status has tasks. Move them to which status?\n${list}\n\nEnter the number:`);
      if (!answer) return;
      const idx = parseInt(answer, 10) - 1;
      const target = others[idx];
      if (!target) { alert("Invalid choice"); return; }
      const res2 = await fetch(`${endpoint}/${id}?reassignTo=${target.id}`, { method: "DELETE" });
      if (!res2.ok) { alert((await res2.json()).error || "Failed"); return; }
      qc.invalidateQueries({ queryKey: [queryKey] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      return;
    }
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: [queryKey] });
  };

  const saveContext = async () => {
    if (!editingContext) return;
    const res = await fetch(`${endpoint}/${editingContext}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ context: contextDraft || null })
    });
    if (!res.ok) { alert("Failed to save context"); return; }
    setEditingContext(null);
    qc.invalidateQueries({ queryKey: [queryKey] });
  };

  return (
    <section className="bg-cream/60 border border-rule rounded-md overflow-hidden">
      <header className="px-6 pt-5 pb-4 border-b border-rule">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="numeral text-vermilion text-[11px]">{n}</span>
          <h2 className="font-display text-[1.5rem] leading-[1.05] tracking-tightish">{title}</h2>
        </div>
        <p className="text-sm text-ash">{subtitle}</p>
      </header>

      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {fields.map((f) => (
            <label key={f.name} className="block">
              <span className="text-[11px] text-ash block mb-1">{f.placeholder}</span>
              <input
                className="input"
                type={f.type === "color" ? "color" : (f.type || "text")}
                value={draft[f.name] || ""}
                onChange={(e) => setDraft({ ...draft, [f.name]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <button className="btn-primary md:self-end" onClick={add}>Add entry</button>
        {error && <span className="text-sm text-vermilion col-span-full">{error}</span>}
      </div>

      <ul className="divide-y divide-rule">
        {q.data?.length === 0 && (
          <li className="px-6 py-6 text-sm text-ash">Nothing here yet.</li>
        )}
        {q.data?.map((it) => (
          <li key={it.id}>
            {editingContext === it.id ? (
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1.05rem]">{it.name} — Context</span>
                  <div className="flex gap-2">
                    <button className="btn-primary !py-1 !px-3 text-xs" onClick={saveContext}>Save</button>
                    <button className="btn-ghost" onClick={() => setEditingContext(null)}><X size={13} /></button>
                  </div>
                </div>
                <textarea
                  className="input min-h-[120px] !text-[13px]"
                  placeholder={`## Project stack\nNext.js 14, Tailwind, Prisma, PostgreSQL\n\n## Structure\nsrc/ — all source\nprisma/ — schema & migrations\n\n## Conventions\n- RSC by default, 'use client' when needed\n- Tailwind for styling\n- Zod for validation`}
                  value={contextDraft}
                  onChange={(e) => setContextDraft(e.target.value)}
                />
              </div>
            ) : (
              <div className="px-6 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {it.color && <span className="w-3.5 h-3.5 rounded-full border border-rule" style={{ background: it.color }} />}
                  <span className="font-display text-[1.05rem]">{it.name}</span>
                  {"rank" in it && it.rank != null && <span className="numeral text-[11px] text-dust">rank {it.rank}</span>}
                  {"context" in it && it.context && <span className="chip !py-0 !px-1.5 text-[9px]"><FileText size={10} /></span>}
                </div>
                <div className="flex gap-1">
                  {"context" in it && (
                    <button className="btn-ghost" onClick={() => { setEditingContext(it.id); setContextDraft((it as any).context || ""); }}>
                      <FileText size={13} /> Context
                    </button>
                  )}
                  <button className="btn-ghost text-vermilion" onClick={() => del(it.id)}>
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TeamsSection() {
  const qc = useQueryClient();
  const teams = useQuery({ queryKey: ["teams"], queryFn: () => fetchJson<Team[]>("/api/teams") });
  const users = useQuery({ queryKey: ["users"], queryFn: () => fetchJson<User[]>("/api/users") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchJson<User>("/api/auth/me") });
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const add = async () => {
    setError(null);
    const res = await fetch("/api/teams", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name })
    });
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    setName("");
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this team? Projects will become unassigned.")) return;
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["teams"] });
    qc.invalidateQueries({ queryKey: ["projects"] });
  };

  const addMember = async (teamId: string) => {
    const res = await fetch(`/api/teams/${teamId}/members`, {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: memberName })
    });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    setMemberName("");
    setAddingMember(null);
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  const removeMember = async (teamId: string, userId: string) => {
    if (!confirm("Remove this member?")) return;
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  const changeRole = async (teamId: string, userId: string, role: "admin" | "member") => {
    const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  const rename = async (teamId: string) => {
    if (!editName.trim()) return;
    const res = await fetch(`/api/teams/${teamId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: editName.trim() })
    });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    setEditingTeam(null);
    setEditName("");
    qc.invalidateQueries({ queryKey: ["teams"] });
  };

  return (
    <section className="bg-cream/60 border border-rule rounded-md overflow-hidden">
      <header className="px-6 pt-5 pb-4 border-b border-rule">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="numeral text-vermilion text-[11px]">05</span>
          <h2 className="font-display text-[1.5rem] leading-[1.05] tracking-tightish">Teams</h2>
        </div>
        <p className="text-sm text-ash">Share projects with other contributors.</p>
      </header>

      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule">
        <label className="block">
          <span className="text-[11px] text-ash block mb-1">Team name</span>
          <input className="input" placeholder="e.g. Frontend Squad" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button className="btn-primary md:self-end" onClick={add}>Create team</button>
        {error && <span className="text-sm text-vermilion col-span-full">{error}</span>}
      </div>

      <ul className="divide-y divide-rule">
        {teams.data?.length === 0 && (
          <li className="px-6 py-6 text-sm text-ash">No teams yet.</li>
        )}
        {teams.data?.map((team) => (
          <li key={team.id} className="px-6 py-4 group">
            <div className="flex items-center justify-between gap-3 mb-3">
              {editingTeam === team.id ? (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <input
                    className="input py-1.5 text-sm flex-1 min-w-0"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") rename(team.id); if (e.key === "Escape") { setEditingTeam(null); setEditName(""); } }}
                    autoFocus
                  />
                  <button className="btn-primary !py-1.5 !px-2" onClick={() => rename(team.id)}><Check size={13} /></button>
                  <button className="btn-ghost" onClick={() => { setEditingTeam(null); setEditName(""); }}><X size={13} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-display text-[1.05rem] truncate">{team.name}</span>
                  <span className="chip text-[9px]">{team.role}</span>
                  {team.role === "admin" && (
                    <button
                      className="btn-ghost opacity-60 hover:opacity-100 transition"
                      onClick={() => { setEditingTeam(team.id); setEditName(team.name); }}
                      title="Rename"
                    >
                      <Pencil size={12} />
                    </button>
                  )}
                </div>
              )}
              {team.role === "admin" && (
                <button className="btn-ghost text-vermilion shrink-0" onClick={() => del(team.id)}>
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>

            <div className="mb-3">
              <span className="text-[11px] text-ash tracking-wide block mb-2">Members</span>
              <div className="flex flex-wrap gap-2">
                {team.members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 chip">
                    @{m.username}
                    {m.role === "admin" && <span className="text-[9px] text-vermilion">admin</span>}
                    {team.role === "admin" && m.userId !== me.data?.id && (
                      <>
                        <button
                          className="ml-1 text-ash hover:text-ink"
                          title={m.role === "admin" ? "Demote to member" : "Promote to admin"}
                          onClick={() => changeRole(team.id, m.userId, m.role === "admin" ? "member" : "admin")}
                        >
                          {m.role === "admin" ? "↓" : "↑"}
                        </button>
                        <button className="ml-0.5 text-ash hover:text-vermilion" onClick={() => removeMember(team.id, m.userId)}>
                          <UserX size={11} />
                        </button>
                      </>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {team.role === "admin" && (
              <div className="flex items-center gap-2">
                {addingMember === team.id ? (
                  <>
                    <input
                      className="input py-1.5 text-sm"
                      placeholder="username"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addMember(team.id)}
                    />
                    <button className="btn-primary !py-1.5 !px-3 text-xs" onClick={() => addMember(team.id)}>Add</button>
                    <button className="btn-ghost" onClick={() => { setAddingMember(null); setMemberName(""); }}>
                      <X size={13} />
                    </button>
                  </>
                ) : (
                  <button className="btn-ghost text-xs" onClick={() => setAddingMember(team.id)}>
                    <UserPlus size={13} /> Add member
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function UsersSection() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["users"], queryFn: () => fetchJson<User[]>("/api/users") });
  const me = useQuery({ queryKey: ["me"], queryFn: () => fetchJson<User>("/api/auth/me") });
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const add = async () => {
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, pin })
    });
    if (!res.ok) { setError((await res.json()).error || "Failed"); return; }
    setUsername(""); setPin("");
    qc.invalidateQueries({ queryKey: ["users"] });
  };
  const resetPin = async (id: string) => {
    const newPin = prompt("New PIN (4-8 digits)");
    if (!newPin) return;
    const res = await fetch(`/api/users/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin: newPin }) });
    if (!res.ok) alert((await res.json()).error || "Failed");
  };
  const del = async (id: string) => {
    if (!confirm("Delete user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: ["users"] });
  };

  return (
    <section className="bg-cream/60 border border-rule rounded-md overflow-hidden">
      <header className="px-6 pt-5 pb-4 border-b border-rule">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="numeral text-vermilion text-[11px]">06</span>
          <h2 className="font-display text-[1.5rem] leading-[1.05] tracking-tightish">Contributors</h2>
        </div>
        <p className="text-sm text-ash">People who can sign in. Each one keeps a PIN.</p>
      </header>

      <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[11px] text-ash block mb-1">Handle</span>
            <input className="input" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-[11px] text-ash block mb-1">PIN</span>
            <input className="input tracking-[0.4em]" placeholder="••••" inputMode="numeric"
                   value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} />
          </label>
        </div>
        <button className="btn-primary md:self-end" onClick={add}>Invite</button>
        {error && <span className="text-sm text-vermilion col-span-full">{error}</span>}
      </div>

      <ul className="divide-y divide-rule">
        {q.data?.map((u) => (
          <li key={u.id} className="px-6 py-3 flex items-center justify-between gap-3">
            <span className="font-display text-[1.05rem]">@{u.username}</span>
            <span className="flex gap-1">
              {me.data?.id === u.id && (
                <button className="btn-ghost" onClick={() => resetPin(u.id)}>Reset PIN</button>
              )}
              <button className="btn-ghost text-vermilion" onClick={() => del(u.id)}><Trash2 size={13} /> Remove</button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
