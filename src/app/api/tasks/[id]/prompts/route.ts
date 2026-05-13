import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { bad, ensureAuth, json } from "@/lib/api";

const include = {
  project: true, priority: true, status: true, category: true,
  author: { select: { id: true, username: true } }
} as const;

const SYSTEM = `You are a senior software developer writing a request to a coding AI agent.

Output rules:
- Output ONLY the prompt text. No explanations, no markdown headers, no preamble, no closing remarks.
- Write in the same language as the task description.
- Keep it under 250 words.
- Focus on what needs to be done, not why.

Anti-hallucination rules (CRITICAL):
- ONLY reference files, components, functions, routes, or variables that are explicitly named in the Project Context or the task notes. Do NOT invent identifiers.
- If the Project Context does not mention specific names, describe behaviour generically (e.g. "the project filter bar", "the list view") instead of inventing names like "ProjectFilterComponent" or "ProjectListService".
- Do not assume a framework, language, or architecture unless the Project Context states it. When unsure, stay framework-agnostic.
- Do not prescribe implementation details (state shape, event names, prop signatures) unless they are present in the Project Context.`;

function buildPrompt(task: {
  title: string; notes: string | null;
  priority: { name: string }; status: { name: string };
  category: { name: string } | null;
  project: { name: string; context?: string | null };
}) {
  let p = `Task: ${task.title}\n`;
  p += `Project: ${task.project.name}\n`;
  p += `Priority: ${task.priority.name}\n`;
  p += `Status: ${task.status.name}\n`;
  if (task.category) p += `Category: ${task.category.name}\n`;
  if (task.notes) p += `\nNotes:\n${task.notes}\n`;
  if (task.project.context) p += `\nProject Context:\n${task.project.context}\n`;
  return p;
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await ensureAuth();
  if (auth.error) return auth.error;

  const task = await prisma.task.findUnique({ where: { id: params.id }, include });
  if (!task) return bad("Not found", 404);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return bad("GEMINI_API_KEY not configured on server");

  const userPrompt = buildPrompt(task);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ parts: [{ text: userPrompt }] }]
        })
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return bad(`Gemini API error: ${err}`, 502);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return bad("Gemini returned empty response", 502);

    return json({ prompt: text.trim() });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Failed to contact Gemini");
  }
}
