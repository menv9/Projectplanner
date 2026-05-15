"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginShell />
    </Suspense>
  );
}

function LoginFallback() {
  return <div className="min-h-screen bg-paper" />;
}

function LoginShell() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/bootstrap").then((r) => r.json()).then((d) => setHasUsers(d.hasUsers));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const url = hasUsers ? "/api/auth/login" : "/api/auth/register";
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, pin })
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error || "Failed");
      return;
    }
    router.push(from);
    router.refresh();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left — editorial cover */}
      <aside className="hidden lg:flex flex-col justify-between p-14 border-r border-rule relative overflow-hidden">
        <div className="eyebrow">Volume 01 · Issue 01</div>
        <div>
          <h1 className="font-display text-[5.5rem] leading-[0.92] tracking-tightish">
            <span className="display-italic text-vermilion">Atelier</span>
            <span className="text-ink">.</span>
          </h1>
          <p className="font-display italic text-[1.4rem] text-ash mt-4 max-w-md">
            A quiet workshop for the things you intend to do — kept on paper, stored in code.
          </p>
          <div className="hairline mt-10 max-w-md" />
          <p className="text-[12.5px] text-ash mt-3 max-w-md leading-relaxed">
            A small place to file what's on your mind. Tabs for each project, hairlines for each thought, a serif for the parts that matter.
          </p>
        </div>
        <div className="flex items-end justify-between text-[10.5px]">
          <span className="eyebrow">Pressed in {new Date().getFullYear()}</span>
          <span className="font-display italic text-ash">— Edition of one</span>
        </div>
      </aside>

      {/* Right — sign-in plate */}
      <section className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <span className="text-[11px] text-ash tracking-wide block mb-3">{hasUsers ? "Subscriber access" : "Founding edition"}</span>
          <h2 className="font-display text-[2.2rem] leading-[1] tracking-tightish mb-1">
            {hasUsers === null ? <span className="text-ash">…</span> : hasUsers ? <><span className="display-italic text-vermilion">Welcome</span> back.</> : <><span className="display-italic text-vermilion">Begin</span> a new ledger.</>}
          </h2>
          <p className="text-sm text-ash mb-8">
            {hasUsers ? "Enter your handle and PIN to continue." : "Choose a handle and a 4–8 digit PIN. This becomes the first user."}
          </p>

          <div className="space-y-5">
            <label className="block">
              <span className="text-[11px] text-ash block mb-1.5">Handle</span>
              <input
                className="input !text-[15px]"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. gorka"
              />
            </label>
            <label className="block">
              <span className="text-[11px] text-ash block mb-1.5">PIN</span>
              <input
                className="input tracking-[0.4em] !text-[15px]"
                inputMode="numeric"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="••••"
              />
            </label>
          </div>

          {error && <div className="mt-4 text-sm text-vermilion">{error}</div>}

          <button
            type="submit"
            className="btn-accent w-full mt-7 !py-3 text-[14px]"
            disabled={busy || !username || pin.length < 4}
          >
            {busy ? "…" : hasUsers ? "Sign in" : "Create the ledger"}
          </button>

          <div className="hairline mt-10" />
          <p className="text-[11px] text-dust mt-3">
            No password recovery, no telemetry, no clever tricks. Just a PIN.
          </p>
        </form>
      </section>
    </div>
  );
}
