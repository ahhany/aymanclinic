# Dr. Ayman Hany Clinic — Digital Patient Records System
## Design & Implementation Plan

**Rev 2 — 2026-11-06** · Based on: Dr. Ayman's ChatGPT discussion export (28 Oct 2025), OBS clinic paper file (2025), GYN clinic paper file (2025)
**Rev 2 changes:** Lovable removed from the build path — the system is developed and tested directly in this workspace and pushed to `github.com/ahhany/aymanclinic`. Front-end stack changed from Next.js to **Vite + React + TS + Tailwind + shadcn/ui** so the repo stays natively importable into Lovable.dev later if that deployment option is chosen. Data layer: Prisma (SQLite for dev/test → Supabase Postgres for production). Companion knowledge base lives in `knowledge/`.

**Rev 2.1 — 2026-11-06:** Dashboards & reports designed before Phase 1 (`knowledge/dashboards-and-reports.md`): five dashboards (Operations, High-Risk Pregnancy Board, Outcomes & Quality, Prescribing Analytics, Research & Export), a 36-report analytical catalogue, and 9 AI-assisted intelligent reports. The design surfaced four cheap-now/expensive-later schema additions (appointments, structured next-visit date, diagnoses, clinic location) proposed for the Phase 1 migration — pending approval (open questions Q11–Q15). Phase 0 scaffold complete and verified.

---

## 1. Background & Goals

### 1.1 Who this is for

Dr. Ayman Hany — Professor of Obstetrics & Gynecology, Faculty of Medicine, Kasr Al Ainy; consultant in high-risk pregnancy, gynecologic endoscopy, infertility and ICSI. He runs an OBS (antenatal) clinic and a GYN (gynecology/infertility) clinic, and works across more than one clinic location.

### 1.2 Current state

Two paper-based patient files, each a 2-page coloured form with a fixed layout Dr. Ayman has used for years. The full field-by-field inventory is captured in `knowledge/data-dictionary.md`; abbreviations in `knowledge/glossary.md`.

- **OBS file — page 1:** demographics (patient-filled), history (married for, contraception, obstetric history grid), past & family history, ultrasound milestones (1st U/S · 11–13 wks scan · 20-wks scan · follow-up scans), delivery data, postnatal visit.
- **OBS file — page 2:** blood group, Rh, LMP, EDD; antenatal visit grid (date, Wt, BP, U/S, complaints, management & next visit); lab grid (Hb%, ferritin, TLC, PLT, ALT, AST, creatinine, urea, PT, PC, FBS, PPBS, urine, Ca++, TSH).
- **GYN file — page 1:** demographics, history (married for, obstetric grid, contraception, menstrual/LMP, past, family), semen analysis, 1st ultrasound (uterus, endometrial thickness, ovaries), remarks.
- **GYN file — page 2:** follow-up grid (date, complaint, U/S, management & next visit).

### 1.3 Goals (as stated by Dr. Ayman)

1. Digitize both files so the app looks and feels like the paper he is used to.
2. One patient, one file — a single patient code across OBS, GYN, and (future) ICSI.
3. Structured data underneath → Excel export for research/statistics at any time.
4. AI lab reader — photograph a lab report and the app fills the fields.
5. "Additional tests" — extend lab panels without redesigning anything.
6. Medication tracking — personal drug library + prescribing analytics.
7. Tablet-first — large tablet with attached keyboard, portable between clinics.
8. Future — ICSI/IVF cycles, dashboards, voice dictation, natural-language clinical search.

### 1.4 Explicit non-goals for v1

ICSI module, dashboards, voice dictation, patient-facing features, billing, lab-system integration.

---

## 2. Product Design

### 2.1 Design principles

1. **Hybrid layout** — paper sections, order, and colour identity, as collapsible interactive sections.
2. **Structured fields first, free text preserved.**
3. **Paper grids become unlimited dated tables.**
4. **AI proposes, the doctor disposes** — every AI value passes Review & Confirm; unclear values left blank, never guessed.
5. **Tablet-first, laptop-equal.**

### 2.2 Information architecture

```
Home / Patient Registry
└── Patient (one record per woman, clinic-wide code e.g. AYC-000125)
    ├── Identity & demographics        (restricted access)
    ├── Clinical Episodes
    │   ├── Pregnancy Episode (OBS)    → obstetric history, U/S milestones,
    │   │                                antenatal visits, labs, delivery, postnatal
    │   ├── GYN Episode                → menstrual/contraception, semen analysis,
    │   │                                1st U/S, follow-up visits
    │   └── ICSI Cycle (Phase 3)
    ├── Visits (dated, unlimited)
    ├── Lab Reports → Lab Results      (source file attached, AI extraction status)
    ├── Prescriptions                  (linked to visit + drug catalogue)
    └── Attachments                    (U/S images, PDFs, reports)
Reports & Export → Research Export Builder (first template: "Pregnant patients, Hb < 11")
Medication Library
Settings (users, roles, test definitions, backups)
```

Core structural decision: **a patient is not a pregnancy is not a lab result.** One patient → many episodes → many visits → many lab reports → many results.

### 2.3 Data model

Full schema with field types lives in `knowledge/data-dictionary.md`. Core tables:

| Table | Purpose |
|---|---|
| `patients` | Internal record (UUID, patient_code, date_of_birth, status) |
| `patient_identity` | **Restricted** name/phone/address ↔ code mapping |
| `episodes` | One row per pregnancy / GYN problem / ICSI cycle |
| `pregnancy_details`, `gyn_details` | Module-specific episode data |
| `obstetric_history` | Rows of the obstetric history grid (shared by both files) |
| `ultrasound_milestones` | 1st U/S, 11–13 wk, 20 wk, follow-up scans, GYN 1st U/S |
| `visits` | Any clinical visit (BP, weight, GA, complaint, management, next visit) |
| `lab_reports` | One uploaded/entered report (source file, AI extraction status) |
| `lab_results` | One row per analyte — **makes "additional tests" free** |
| `test_definitions` | Extensible test dictionary (code, unit, ref ranges, panel) |
| `medications` | Drug catalogue (brand ↔ active ingredient) |
| `prescriptions` | Prescribing events (dose, frequency, duration, indication, dates) |
| `attachments` | Files (U/S images, PDFs, report scans) |
| `users`, `audit_log` | Auth & traceability |

Adding a new test = inserting a row in `test_definitions`, not a schema migration.

### 2.4 Screen list

1. **Login** (email + password).
2. **Patient Registry** — search by name, code, or mobile; module chips OBS / GYN / ICSI.
3. **Patient 360** — digital twin of the paper file: demographics header + hybrid sections in the paper's original order and colours.
4. **Visit entry** — fast row entry mirroring the paper grid, auto-save.
5. **Lab entry** — manual grid (mirrors the paper lab row) or **AI Lab Reader** (camera/PDF → extraction → Review & Confirm → save; source image attached).
6. **Medication Library** — personal list grouped by active ingredient; reuse previous prescriptions.
7. **Reports & Export** — Research Export Builder; first template *Pregnant patients with Hb < 11 g/dL* → 5-sheet anonymized Excel workbook + Export_Metadata sheet (unit normalization g/L→g/dL, GA at sample date, trimester classification, one-row-per-pregnancy vs per-measurement, validation rules — as designed in the ChatGPT discussion).
8. **Dashboards (Phase 2–3)** — five role-oriented boards designed in `knowledge/dashboards-and-reports.md`: **DB1 Clinic Operations** (today's list, volumes, pending items — the future home screen), **DB2 High-Risk Pregnancy Board** (GA clock, BP/Hb/GDM/scan-gap watches, overdue follow-ups), **DB3 Outcomes & Quality** (CS rate, complications, anemia program, infertility mix), **DB4 Prescribing & Practice Analytics** (his explicit request: events vs repeats vs unique patients, brand ↔ ingredient), **DB5 Research & Export** (cohort templates, export history, data-quality warnings).
9. **Settings** — users & roles, test definitions, medication catalogue, full-database export.

### 2.5 AI feature set (with safety rules)

| Feature | Phase | Rule |
|---|---|---|
| AI Lab Reader | 2 | Extraction → Review & Confirm → save. Unclear = blank. Units captured & normalized; unknown units flagged. |
| AI Lab Trend | 2–3 | Compares values across visits; never prescribes. |
| Clinical Note Assistant | 3 | Structures shorthand; no invented facts. |
| Voice Dictation | 3 | Egyptian Arabic / English medical terms → draft → review. |
| Clinical Search | 3 | Natural language over structured data. |
| Missing Data Reminder | 3 | Lists gaps; **never** makes treatment decisions. |

AI provider is env-configured (OpenAI / Anthropic / Gemini vision models) behind a single internal interface, **disabled by default** until a data-processing agreement and legal review are in place.

---

## 3. Tablet App vs Web App — Assessment (unchanged conclusion)

A **Progressive Web App** is a web app that installs on the tablet's home screen, opens fullscreen, uses the camera, and caches offline. On Dr. Ayman's 12–14″ tablet (landscape, keyboard, stylus) it *is* the tablet app — while also working on his laptop and a receptionist's PC from one codebase, with instant updates and no app-store overhead. A native tablet app only wins on heavy offline use; mitigated by auto-save + encrypted local caching, and the codebase can be wrapped natively later without data migration.

**Verdict: web app delivered as a PWA. UI designed tablet-first.**

---

## 4. Implementation Plan (Rev 2 — direct build, no prototyping tools)

**Source of truth:** `https://github.com/ahhany/aymanclinic.git` (exists, currently empty, verified reachable). Feature branches → PR → `main`; tag each phase release. Knowledge base in `knowledge/` — all decisions, field mappings, and open questions live in files, never in chat memory.

### 4.1 Tech stack (final)

| Layer | Choice | Why |
|---|---|---|
| Front end | **Vite + React + TypeScript + Tailwind + shadcn/ui** | This is Lovable.dev's exact native stack — keeps the "import into Lovable later" option fully open while deploying equally well to Vercel/Netlify/Cloudflare/self-host |
| PWA | `vite-plugin-pwa` | Home-screen install, fullscreen, offline shell |
| Data layer | **Prisma ORM** behind a repository interface | One schema; swap DB without touching app code |
| Dev/test DB | **SQLite** (file-based) | No Docker on the dev machine; zero-install, fully local, fast tests |
| Production DB | **Supabase Postgres** (Dr. Ayman's own project) | He owns the data; auth + storage included |
| Auth | Supabase Auth in prod; local credential auth in dev behind the same interface | Roles from day 1 (doctor / reception / assistant) |
| Storage | Local disk in dev; Supabase Storage in prod | Attachments & lab report images |
| AI | Env-configured provider behind one interface, disabled by default | No PHI to any AI API until DPA + legal review |
| Tests | **Vitest** (unit) + **Playwright** (e2e) | Clinical logic is unit-tested; golden flows e2e-tested |
| Export | SheetJS (`xlsx`) | 5-sheet research workbooks |

Schema portability rule: no Postgres-only column types; JSON payloads stored as text; UUIDs as strings. This keeps SQLite-dev ⇄ Postgres-prod interchangeable.

### 4.2 Phases

**Phase 0 — Scaffold & design foundation (week 1)**
Repo init in the real stack (nothing throwaway): Vite/React/TS/Tailwind/shadcn, PWA plugin, Prisma schema from `knowledge/data-dictionary.md`, auth shell, theme tokens matching the paper files' colours, i18n structure, CI (lint + typecheck + unit tests), seed script with 10 fictional demo patients.

**Phase 1 — Functional clinic system, MVP (weeks 2–7)**
Patient registry & search; OBS + GYN digital forms (hybrid layout, paper colours); visit grids; manual lab entry; attachments; medication library; patient-file print-to-PDF; roles; audit log; local backup/export. Schema additions from the dashboard design, if approved (Q11–Q14): `appointments`, `visits.nextVisitDate`, `diagnoses`, `location`. **Exit gate: full e2e suite green on 10 fictional patients.**

**Phase 2 — AI & research engine + daily dashboards (weeks 8–12)**
AI Lab Reader (Review & Confirm), additional-tests dictionary UI, medication analytics, Research Export Engine with the Hb < 11 template, offline draft hardening. **Dashboards DB1 (Operations), DB2 (High-Risk Pregnancy Board) and DB4 (Prescribing & Practice Analytics — promoted at Dr. Ayman's request, D22).**

**Phase 3 — Expansion (after review of the ICSI paper file)**
ICSI/IVF module; **dashboards DB3 (Outcomes & Quality) and DB5 (Research & Export)**; intelligent reports I1–I9 (pre-visit briefs, lab-trend narratives, missing-data reminders, clinical search, voice dictation, prescribing insights, combination watches, cohort suggestions); advanced filters and anonymized research datasets.

### 4.3 Testing strategy

- **Unit (Vitest):** unit conversion (g/L↔g/dL), GA & trimester calculation at sample date, Hb-threshold filtering, prevalence denominators (pregnancies vs measurements), validation rules from the discussion (missing Hb, unknown unit, duplicates, missing LMP, AI-extracted-needs-verification).
- **E2E (Playwright):** golden flows — register patient → open OBS episode → record visits → enter lab → prescribe → export Excel; same for GYN; AI review flow with a stubbed provider.
- **Data:** 10 fictional demo patients with 2–3 visits each; **no real patient data until Dr. Ayman approves the tested system.**
- Every push: lint + typecheck + unit tests; phase tags require green e2e.

### 4.4 Deployment (decision deferred by design)

The repo stays platform-agnostic so any of these works later:
1. **Import into Lovable.dev** — native stack match, connects their Supabase integration.
2. **Vercel / Netlify / Cloudflare Pages** + Supabase — simplest independent production.
3. **Self-host** (Docker/VPS) — full control.

Production cutover checklist (before real data): Supabase project under Dr. Ayman's account, env vars documented in `knowledge/`, Egyptian Law 151/2020 review (encryption, roles, audit log, retention policy, anonymized exports, full-DB export).

### 4.5 Key risks & mitigations

| Risk | Mitigation |
|---|---|
| AI misreads a lab value | Mandatory Review & Confirm; verification status per result; unclear = blank |
| Unit chaos (g/dL vs g/L) | Unit stored per result; normalization at query time; unknown units flagged |
| Paper habits resist change | Hybrid layout keeps his exact sections/colours; tablet-first grid entry |
| SQLite⇄Postgres drift | Portability rules in §4.1 + CI runs schema against both before Phase 2 ends |
| Offline edits conflict | v1 online-first with local draft autosave; true sync deferred to hardening in Phase 2 |
| Repo drifts from Lovable-importable shape | Stack fixed to Lovable-native (§4.1); no Next.js-only constructs |

### 4.6 Open questions for Dr. Ayman

Tracked in `knowledge/open-questions.md` — device usage pattern, layout fidelity sign-off after first screens, additional users, internet reliability per clinic, historical paper-record back-entry, Supabase account ownership, medication catalogue seeding.

---

## 5. Immediate next step

Scaffold Phase 0 in this workspace: repo init, Prisma schema from the data dictionary, theme, auth shell, demo seed — then open the first hybrid OBS/GYN screens for Dr. Ayman's layout sign-off.
