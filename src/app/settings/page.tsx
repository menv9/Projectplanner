"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import type { Category, Priority, Project, Status, User } from "@/types";

const fetchJson = async <T,>(url: string): Promise<T> => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-paper/60 backdrop-blur-sm">
        <div className="max-w-[1100px] mx-auto px-8 py-6 flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-1">Appendix · Configuration</div>
            <h1 className="font-display text-[2.6rem] leading-[0.95] tracking-tightish">
              <span className="display-italic text-vermilion">Settings</span>
            </h1>
          </div>
          <Link href="/" className="btn"><ArrowLeft size={14} /> Back to atelier</Link>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-8 py-10 space-y-8">
        <Section<Project>
          n="01"
          title="Projects"
          subtitle="Each project becomes its own tab on the workshop floor."
          endpoint="/api/projects"
          queryKey="projects"
          fields={[{ name: "name", placeholder: "Project name", required: true }, { name: "color", placeholder: "#hex", type: "color" }]}
        />
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
          subtitle="The columns of progress. Todo, doing, done — or whatever you like."
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
        <UsersSection />
      </main>
    </div>
  );
}

type FieldDef = { name: string; placeholder: string; type?: string; required?: boolean };

function Section<T extends { id: string; name: string; color?: string | null; rank?: number }>({
  n, title, subtitle, endpoint, queryKey, fields
}: { n: string; title: string; subtitle: string; endpoint: string; queryKey: string; fields: FieldDef[] }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: [queryKey], queryFn: () => fetchJson<T[]>(endpoint) });
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

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
    if (!res.ok) { alert((await res.json()).error || "Failed"); return; }
    qc.invalidateQueries({ queryKey: [queryKey] });
  };

  return (
    <section className="paper-card">
      <div className="relative z-[1]">
        <header className="px-6 pt-5 pb-4 border-b border-rule">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="numeral text-vermilion text-[12px]">{n}</span>
            <span className="hairline flex-1 translate-y-[-3px]" />
          </div>
          <h2 className="font-display text-[1.7rem] leading-[1.05] tracking-tightish">{title}</h2>
          <p className="text-sm text-ash mt-1 italic">{subtitle}</p>
        </header>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule bg-cream/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {fields.map((f) => (
              <label key={f.name} className="block">
                <span className="eyebrow block mb-1">{f.placeholder}</span>
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
            <li className="px-6 py-6 text-sm text-ash italic">Nothing here yet.</li>
          )}
          {q.data?.map((it) => (
            <li key={it.id} className="px-6 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {it.color && <span className="w-3.5 h-3.5 rounded-full border border-rule" style={{ background: it.color }} />}
                <span className="font-display text-[1.05rem]">{it.name}</span>
                {"rank" in it && it.rank != null && <span className="numeral text-[11px] text-dust">rank {it.rank}</span>}
              </div>
              <button className="btn-ghost text-vermilion" onClick={() => del(it.id)}>
                <Trash2 size={13} /> Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function UsersSection() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["users"], queryFn: () => fetchJson<User[]>("/api/users") });
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
    <section className="paper-card">
      <div className="relative z-[1]">
        <header className="px-6 pt-5 pb-4 border-b border-rule">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="numeral text-vermilion text-[12px]">05</span>
            <span className="hairline flex-1 translate-y-[-3px]" />
          </div>
          <h2 className="font-display text-[1.7rem] leading-[1.05] tracking-tightish">Contributors</h2>
          <p className="text-sm text-ash mt-1 italic">People who can sign in. Each one keeps a PIN.</p>
        </header>

        <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end border-b border-rule bg-cream/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="eyebrow block mb-1">Handle</span>
              <input className="input" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
            </label>
            <label className="block">
              <span className="eyebrow block mb-1">PIN</span>
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
                <button className="btn-ghost" onClick={() => resetPin(u.id)}>Reset PIN</button>
                <button className="btn-ghost text-vermilion" onClick={() => del(u.id)}><Trash2 size={13} /> Remove</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
