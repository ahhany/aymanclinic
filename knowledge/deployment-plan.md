# Deployment Plan — Lovable Import + Direct Static Hosting (D27, D28)

Decision: deploy via **Lovable** (Ahmed's choice over Supabase+Vercel / VPS / clinic-PC options). Source of truth: `github.com/ahhany/aymanclinic` (main pushed 2026-11-06). Lovable syncs two-way with GitHub, so development continues in this workspace; every push flows into Lovable.

**2026-11-06 update (D28):** the direct static-hosting track (Supabase + Vercel/Cloudflare Pages) is prepared IN PARALLEL — both tracks share the same backend pieces (standalone API + Supabase Postgres). Whichever frontend proves better becomes the primary; the other stays as a failover URL.

## Production building blocks (all in the repo, tested)

- `server/standalone.ts` — the same API as the dev middleware, as its own Node process. `npm run api:start`. Env: `PORT`, `DATABASE_URL`, `CORS_ORIGIN` (comma-separated allowed origins; preflight verified). Host on Render/Fly (free tier), deploys straight from GitHub.
- `src/db/apiClient.ts` — `VITE_API_BASE_URL` seam: every call (incl. auth + attachment URLs) prefixes it when set; same-origin in dev.
- `vercel.json` — SPA rewrite for Vercel. `public/_redirects` — SPA fallback for Cloudflare Pages/Netlify. React-router deep links work on both.
- `.env.example` — every variable both sides need.

## What works immediately after Lovable import
- All screens, dashboards, print view, PWA shell — in Lovable's dev preview AND its published hosting (static build). (Data loads only once the hosted API + Supabase below exist.)

## Backend setup (shared by both tracks — do once)

1. **Supabase** (Dr. Ayman's own account): create project, region = EU closest available (note Law 151/2020 residency question — D15/D18 legal review still pending before REAL patient data).
2. `DATABASE_URL=<supabase pooler url> npx prisma migrate deploy` then seed demo users (strong passwords, not demo1234).
3. **API hosting** (Render or Fly): new web service from the GitHub repo; build `npm install`; start `npm run api:start`; env `DATABASE_URL`, `CORS_ORIGIN=<both frontend URLs>`.
4. **Frontends**:
   - *Lovable:* import from GitHub (if not done), set `VITE_API_BASE_URL=<api url>` → publish.
   - *Vercel:* import repo, framework = Vite, env `VITE_API_BASE_URL=<api url>` → deploy. (Cloudflare Pages alternative: build `npm run build`, output `dist/`.)
5. Tablet test: install as PWA from the URL(s).

## Go-live checklist (in order)
1. Ahmed creates the Lovable project: import from GitHub repo `ahhany/aymanclinic`.
2. Verify the Lovable preview builds and renders (fictional demo data won't load — expected, no backend yet).
3. Supabase project + migrate + seed (see backend setup).
4. Deploy the Node API, verify `https://<api>/api/health` from a browser.
5. Set `VITE_API_BASE_URL` on the frontend host(s) → republish → tablet test (install as PWA).
6. Dr. Ayman acceptance test with fictional data (D16 gate) → only then real records.

## Auth note
Dev auth (`dev-<userId>` tokens, scrypt passwords) is acceptable for the pilot over HTTPS but must be replaced (Supabase Auth or hardened sessions + rate limiting) before real data. Tracked as a go-live blocker, not a demo blocker.
