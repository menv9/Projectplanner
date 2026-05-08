"use client";
import { useEffect, useState } from "react";
import { Sparkles, Copy, Check, X } from "lucide-react";

export function PromptModal({
  taskId, onClose
}: { taskId: string; onClose: () => void }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/tasks/${taskId}/prompts`, { method: "POST" })
      .then(async (r) => {
        if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || "Failed"); }
        const d = await r.json();
        setPrompt(d.prompt);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  });

  const copy = async () => {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />
      <section
        role="dialog"
        aria-modal="true"
        className="paper-card relative z-[1] w-full max-w-xl max-h-[80vh] flex flex-col shadow-[0_30px_80px_-30px_rgba(0,0,0,0.5)]"
        style={{ borderRadius: 0 }}
      >
        <div className="relative z-[1] flex items-start justify-between gap-4 border-b border-rule px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-vermilion" />
            <h2 className="font-display text-[1.3rem] leading-[1.1] tracking-tightish">AI Prompt</h2>
          </div>
          <button type="button" className="btn-ghost shrink-0" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="relative z-[1] overflow-y-auto px-5 py-5 sm:px-6 flex-1">
          {loading && (
            <div className="flex items-center gap-3 text-ash">
              <Sparkles size={16} className="animate-pulse" />
              <span className="eyebrow">Generating prompt…</span>
            </div>
          )}
          {error && (
            <div className="text-sm text-vermilion">{error}</div>
          )}
          {prompt && (
            <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-ink">
              {prompt}
            </pre>
          )}
        </div>

        {prompt && (
          <footer className="relative z-[1] flex items-center justify-end gap-2 border-t border-rule px-5 py-3 sm:px-6">
            <button className="btn" onClick={copy}>
              {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy prompt</>}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
}
