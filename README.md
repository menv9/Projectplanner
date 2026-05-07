# Project Planner

Single-page task organizer across multiple projects. Tasks are categorized by project, priority, status, author, category and due date, with notes. Add new tasks via a 2-step modal. Filter the task list by any field.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind
- PostgreSQL (Railway) + Prisma
- Username + PIN auth (bcrypt + JWT cookie)

## Setup with Railway

### 1. Create the database
1. Go to https://railway.app and sign in.
2. **New Project → Provision PostgreSQL**.
3. Click the Postgres service → **Variables / Connect** tab → copy the **Postgres Connection URL** (the public one, looks like `postgresql://postgres:...@viaduct.proxy.rlwy.net:1234/railway`).

### 2. Configure local env
Copy `.env.example` to `.env.local` and fill it in:
```
DATABASE_URL="<the URL you just copied>"
JWT_SECRET="<32+ random chars>"
```
Generate a JWT secret in PowerShell:
```powershell
[Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

### 3. Install, migrate, seed
```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run
```bash
npm run dev
```
Open http://localhost:3000. The first visit will let you create the first user.

## Features
- **One main page** (`/`) with task grid + filter bar + a "+ New task" button that opens a 2-step modal:
  1. **Basics** — title, project, author, priority, status, category, due date
  2. **Details** — notes
- **Filter** by project, priority, status, author, category, due date range, free text search.
- **Settings page** (`/settings`) — manage projects, priorities, statuses, categories and users.
- **Auth** — `/login` with username + PIN. Cookie session for 7 days.

## Scripts
- `npm run dev` — start dev server
- `npm run db:migrate` — apply schema migrations
- `npm run db:seed` — seed default Priorities/Statuses/Categories/Project
- `npm run db:studio` — open Prisma Studio
