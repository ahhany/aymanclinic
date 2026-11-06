# Ayman Clinic — Digital Patient Records

Digital twin of Dr. Ayman Hany's paper OBS / GYN clinic files, built tablet-first as a PWA.
Stack: Vite + React + TypeScript + Tailwind v4 + Prisma (SQLite dev → Supabase Postgres prod).

**Everything the project knows is in `knowledge/`** — decisions, data dictionary, glossary, open questions. Read those before changing anything.

## Setup

```bash
npm install
# create local env (see below), then:
npx prisma migrate dev      # creates ./prisma/dev.db
npm run db:seed             # 10 fictional demo patients + test dictionary
npm run dev                 # http://localhost:5173 (API served on /api by the same process)
```

Local env: create a file named `.env` in the repo root containing

```
DATABASE_URL="file:./dev.db"
```

(The file is gitignored; Prisma 6 loads it automatically.)

## Demo logins (seeded, fictional)

| Email | Password | Role |
|---|---|---|
| doctor@clinic.local | demo1234 | doctor |
| reception@clinic.local | demo1234 | reception |

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server **with the dev API on `/api`** (forwards `--host`/`--port`) |
| `npm run test` | Vitest unit tests (clinical logic) |
| `npm run lint` / `npm run typecheck` | Static checks |
| `npm run build` | Type-check + production build |
| `npm run db:migrate` / `db:seed` / `db:studio` | Prisma workflows |

## Repo rules

- Decisions are appended to `knowledge/decisions.md` — never in chat.
- Schema changes start from `knowledge/data-dictionary.md`, then `prisma migrate dev`.
- No real patient data anywhere in this repo or in dev databases (D16).
- Branch → PR → `main`; phase releases are tagged (D17).
