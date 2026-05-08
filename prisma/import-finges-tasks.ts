import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CsvRow = Record<string, string>;

const csvPath = process.argv[2] || process.env.FINGES_CSV_PATH || "C:/Users/Gorka/Desktop/Finges app.csv";

const lowPriority = { name: "Low", rank: 1, color: "#6b7280" };
const fallbackPriority = { name: "Unprioritized", rank: 0, color: "#9a9081" };

const statusMap: Record<string, { name: string; rank: number; color: string }> = {
  "No iniciada": { name: "To Do", rank: 1, color: "#6b7280" },
  "En curso": { name: "Doing", rank: 2, color: "#3b82f6" },
  Bloqueada: { name: "Blocked", rank: 3, color: "#c33518" },
  "pensar mejor": { name: "Needs Review", rank: 4, color: "#5b2840" },
  Completada: { name: "Done", rank: 5, color: "#2f5a3a" }
};

const fallbackStatus = statusMap["No iniciada"];

function parseCsv(input: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() || ""])));
}

function cleanTaskTitle(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeStatus(value: string) {
  const trimmed = value.trim();
  return statusMap[trimmed] || fallbackStatus;
}

function normalizePriority(value: string) {
  const trimmed = value.trim().toUpperCase();
  return trimmed.startsWith("P") ? lowPriority : fallbackPriority;
}

function buildNotes(row: CsvRow) {
  const parts = [
    row.Notas && `Notas originales:\n${row.Notas}`,
    row.Propietario && `Propietario original: ${row.Propietario}`,
    row.Hito && `Hito: ${row.Hito}`,
    row.Distribuible && `Distribuible: ${row.Distribuible}`,
    row["Fecha de inicio"] && `Fecha de inicio original: ${row["Fecha de inicio"]}`,
    row["Fecha de finalizaciÃ³n"] && `Fecha de finalizacion original: ${row["Fecha de finalizaciÃ³n"]}`
  ].filter(Boolean);

  return parts.length ? parts.join("\n\n") : null;
}

async function main() {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  const csv = fs.readFileSync(csvPath, "utf8");
  const rows = parseCsv(csv).filter((row) => cleanTaskTitle(row.Tarea || ""));

  const author = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!author) {
    throw new Error("No users found. Create/login with a user in the app before importing tasks.");
  }

  const project = await prisma.project.upsert({
    where: { name: "Finges App" },
    update: { color: "#c33518" },
    create: { name: "Finges App", color: "#c33518" }
  });

  const category = await prisma.category.upsert({
    where: { name: "Imported" },
    update: { color: "#5b2840" },
    create: { name: "Imported", color: "#5b2840" }
  });

  const priorities = new Map<string, string>();
  for (const priority of [lowPriority, fallbackPriority]) {
    const saved = await prisma.priority.upsert({
      where: { name: priority.name },
      update: { rank: priority.rank, color: priority.color },
      create: priority
    });
    priorities.set(priority.name, saved.id);
  }

  const statuses = new Map<string, string>();
  for (const status of [...Object.values(statusMap)]) {
    const saved = await prisma.status.upsert({
      where: { name: status.name },
      update: { rank: status.rank, color: status.color },
      create: status
    });
    statuses.set(status.name, saved.id);
  }

  let created = 0;
  let skipped = 0;

  for (const row of rows) {
    const title = cleanTaskTitle(row.Tarea);
    const exists = await prisma.task.findFirst({
      where: {
        title,
        projectId: project.id
      },
      select: { id: true }
    });

    if (exists) {
      skipped += 1;
      continue;
    }

    const priority = normalizePriority(row.Prioridad || "");
    const status = normalizeStatus(row.Estado || "");

    await prisma.task.create({
      data: {
        title,
        notes: buildNotes(row),
        projectId: project.id,
        authorId: author.id,
        priorityId: priorities.get(priority.name)!,
        statusId: statuses.get(status.name)!,
        categoryId: category.id
      }
    });
    created += 1;
  }

  console.log(`Imported ${created} tasks into ${project.name}. Skipped ${skipped} existing tasks.`);
  console.log(`Source: ${path.normalize(csvPath)}`);
}

main().finally(() => prisma.$disconnect());
