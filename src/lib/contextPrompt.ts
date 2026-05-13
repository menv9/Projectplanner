export const CONTEXT_BOOTSTRAP_PROMPT = `I'm using a task planner that lets me attach a "Project Context" document to each project. This context is fed to an AI prompt generator to keep its task prompts grounded in the real codebase (so it stops inventing fictional component and file names).

Please analyse THIS codebase and produce a concise Project Context document I can paste back into the planner. Use exactly this structure:

## Stack
One short paragraph listing the framework, language, key libraries, and database/storage.

## Key files / components
A bullet list of the most important files and components, each with a one-line description of what it does. Use the real paths and names from the repo.

## Conventions
3–7 short bullets describing how the codebase is structured (routing pattern, state management, styling approach, validation, testing, etc).

Rules:
- Only use REAL identifiers that exist in this repo. Do not invent file or component names.
- Be concise — aim for under 300 words total.
- Output ONLY the document. No preamble, no closing notes, no markdown code fences.`;
