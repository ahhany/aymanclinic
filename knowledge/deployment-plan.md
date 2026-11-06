# Deployment Plan — Lovable Import (chosen 2026-11-06, D27)

Decision: deploy via **Lovable** (Ahmed's choice over Supabase+Vercel / VPS / clinic-PC options). Source of truth: `github.com/ahhany/aymanclinic` (main pushed 2026-11-06). Lovable syncs two-way with GitHub, so development continues in this workspace; every push flows into Lovable.

## Why it fits
The frontend is exactly Lovable's native stack (D5 was chosen for this): Vite + React + TS + Tailwind + shadcn/ui. Import needs no code change for the UI.

## What works immediately after import
- All screens, dashboards, print view, PWA shell — in Lovable's dev preview AND its published hosting (static build).

## What does NOT work when published (and the plan)
Our API is Vite dev-server middleware (`server/` + D20). Published hosting is static — no Node process. Two paths:

### Path B (chosen for first go-live): keep the Node API, host it separately
- Host `server/` as a small always-on Node service (Render / Fly.io free tier) pointed at Supabase Postgres.
- Frontend finds it via `VITE_API_BASE_URL` (seam added in `src/db/apiClient.ts` — every call incl. auth + attachment URLs prefixes it; dev stays same-origin when unset).
- Database: Supabase project owned by Dr. Ayman; `prisma migrate deploy` with the production `DATABASE_URL` (SQLite-portability rules D6 already keep the schema compatible).
- Attachments: swap `uploads/` for a Supabase Storage bucket + signed URLs at the same seam (`server/attachments.ts`), or keep file storage on the Node host initially.
- Effort: ~1 session. Pros: zero rewrites of business logic (EDD, patient codes, payload validation stay server-side). Cons: two platforms to babysit; free-tier cold starts.

### Path A (later, optional): Lovable Cloud / Supabase-native
- Rewrite the data layer to call Supabase directly from `apiClient.ts` (PostgREST + RLS + Supabase Auth + Storage). Server logic moves to Postgres functions or the shared `src/lib/*` modules client-side.
- Bigger rework, more lock-in, but one platform and Lovable-native. Revisit after go-live.

## Go-live checklist (in order)
1. Ahmed creates the Lovable project: import from GitHub repo `ahhany/aymanclinic`.
2. Verify the Lovable preview builds and renders (fictional demo data won't load — expected, no backend yet).
3. Create Dr. Ayman's Supabase project (region: EU closest available; note Law 151/2020 residency question — D15/D18 legal review still pending before REAL patient data).
4. `prisma migrate deploy` + seed demo users (strong passwords, not demo1234) against Supabase.
5. Deploy the Node API (Render/Fly), env: `DATABASE_URL`, CORS allow the Lovable domain.
6. Set `VITE_API_BASE_URL` in Lovable → republish → tablet test (install as PWA).
7. Dr. Ayman acceptance test with fictional data (D16 gate) → only then real records.

## Auth note
Dev auth (`dev-<userId>` tokens, scrypt passwords) is acceptable for the pilot over HTTPS but must be replaced (Supabase Auth or hardened sessions + rate limiting) before real data. Tracked as a go-live blocker, not a demo blocker.
