# Dashboards & Reports Design

Designed 2026-11-06 against the Phase-0 data model (`knowledge/data-dictionary.md`, 17 tables) and Dr. Ayman's stated goals (plan §1.3). Audiences: **administrative** (running the clinics), **clinical** (who needs attention today), **medical/academic** (outcomes, quality, research).

Design rules carried from decisions: every number must trace to structured fields (D7); anything AI-generated is a draft for review (D9); research views use anonymous IDs only (D11).

---

## 1. The five dashboards

### DB1 — Clinic Operations *(administrative)* · home screen
**Question it answers:** "What does my practice look like today / this week?"

| Widget | Source |
|---|---|
| Today's list — patients seen today, by module | `visits.visitDate` |
| New registrations (today / week / month) | `patients.createdAt` |
| Visit volume trend (per day, OBS vs GYN) | `visits` + `episodes.type` |
| Active files: open pregnancies / open GYN episodes / future ICSI | `episodes.status` |
| Pending items: lab reports awaiting review, visits missing management notes | `lab_reports.aiExtractionStatus`, `visits.management IS NULL` |
| Appointments today & no-shows | **`appointments` table — does not exist yet (gap G1)** |

### DB2 — High-Risk Pregnancy Board *(clinical)* · his specialty — الحمل الحرج
**Question:** "Which pregnant patient needs my attention first?"

| Widget | Source |
|---|---|
| Active pregnancies by trimester (GA clock) | `pregnancy_details.lmpDate` + `ga.ts` |
| Approaching term (≥37 wks) / post-dates (≥40 wks) | LMP/EDD vs today |
| EDD due this month | `eddDate` |
| BP watch: last recorded BP ≥ 140/90 | `visits.bpSystolic/Diastolic` |
| Anemia watch: latest Hb < 11 (and < 10), low ferritin | `lab_results` + `units.ts` |
| GDM screen due: 24–28 wks with no FBS on file | GA + `lab_results(testCode=FBS)` |
| Scan gaps: ≥22 wks without a 20-wk anatomy scan | `ultrasound_milestones` |
| Overdue follow-ups: promised next-visit date passed | **`visits.nextVisitDate` — not yet structured (gap G2)** |

### DB3 — Outcomes & Quality *(medical)* · monthly view
**Question:** "What are my results, and are they improving?"

| Widget | Source |
|---|---|
| Mode of delivery: CS vs vaginal rate over time | `pregnancy_details.deliveryMode` |
| Preterm / term / post-term split (delivery GA) | `deliveryDate` vs `lmpDate` |
| Maternal & fetal complication rates | `pregnancy_details` |
| Anemia program: prevalence of Hb<11 by trimester; iron-prescription coverage of anemic patients; Hb response after iron | `lab_results` + `prescriptions` |
| Postnatal follow-up rate | `postnatalDate` |
| Infertility mix: primary vs secondary, work-up completeness (semen analysis done? TSH done?) | `obstetric_history`, `semen_analyses`, `lab_results` |
| File completeness score | cross-table null audit |

### DB4 — Prescribing & Practice Analytics *(administrative-medical)* · his explicit request
**Question:** "What do I actually prescribe, and how is my practice evolving?"

| Widget | Source |
|---|---|
| Top medications — **prescription events vs repeat prescriptions vs unique patients** (the distinction from the ChatGPT discussion) | `prescriptions` |
| Brand ↔ active-ingredient grouping toggle | `medications` |
| Prescribing trend over time, per module | `prescriptions.prescriptionDate` + `episodes.type` |
| Diagnosis distribution | **`diagnoses` entity — does not exist yet (gap G3)** |
| Lab utilization: most-ordered tests, tests per pregnancy | `lab_results` |
| Average visits per pregnancy / per GYN episode | `visits` |

### DB5 — Research & Export *(medical/academic)* · gateway to the export engine
**Question:** "What can I study, and is the data good enough?"

| Widget | Source |
|---|---|
| Saved cohort templates with live counts (Hb<11, preterm, recurrent miscarriage ≥2 abortions, previous CS…) | research query engine over current schema |
| Export history & reproducibility metadata | `audit_log(action=export)` + Export_Metadata sheet |
| Data-quality warnings: missing LMP/EDD, unknown units, unverified AI results, duplicates | validation rules (plan §4 discussion) |
| Anonymization status indicator | identity separation (D11) |

**Suggested cadence:** DB1 + DB2 in **Phase 2** (daily-use value; DB2 is his specialty), DB3 + DB4 in **Phase 3**, DB5 ships with the Research Export Engine (Phase 2–3 boundary). Home screen becomes DB1.

---

## 2. Analytical reports catalogue (deterministic — from current model)

**Registry & activity**
- R1 Patient census by module, status, period · R2 New registrations per period · R3 Visit activity per day/week/month/module · R4 Visits per pregnancy / per episode (distribution)

**Obstetric**
- R5 Active pregnancy census with GA & trimester · R6 ANC coverage (patients ≥34 wks with <4 visits) · R7 EDD list by month · R8 **Hb < 11 g/dL export** (the designed 5-sheet workbook — first template) · R9 Hb < 10 · R10 Low Hb + low ferritin · R11 Hb response to iron (paired before/after) · R12 Hb by trimester distribution · R13 Hypertension report (max/last BP ≥ 140/90) · R14 Glycemia: FBS/PPBS distributions & abnormality rates · R15 GDM screening coverage (24–28 wks, no FBS) · R16 Liver/renal/coag abnormality rates (ALT, AST, creatinine, urea, PT, PC) · R17 TSH abnormalities in pregnancy · R18 Delivery outcomes (mode, complications, fetal sex, hospital, preterm/term/post-term) · R19 Postnatal follow-up & scar/complications report · R20 Obstetric history cohorts: previous CS, recurrent miscarriage (≥2 abortions), grand multipara · R21 Ultrasound milestone completeness (NT / anatomy / follow-up scans)

**Gynecology & infertility**
- R22 Menstrual pattern distribution · R23 Contraception use distribution · R24 Semen analysis report (count, motility A–D, morphology; abnormal-parameter rates; male-factor share) · R25 Infertility work-up completeness (semen done, TSH done, U/S done) · R26 Primary vs secondary infertility breakdown

**Prescribing & labs**
- R27 Top medications (events / repeats / unique patients, brand vs ingredient, per period & module) · R28 Iron-therapy prescribing patterns · R29 Prescriptions per visit ratio · R30 Lab utilization & most-ordered tests · R31 Missing-test patterns (informs panel design)

**Data quality & reproducibility**
- R32 Missing-data report (LMP, EDD, outcomes) · R33 Unknown-unit / unverified-result report · R34 Duplicate lab report detection · R35 Export metadata & reproducibility log

**Generic**
- R36 Cohort Export Builder — any module × fields × filters → anonymized Excel (the reusable engine; R8–R11 etc. become templates)

## 3. Intelligent reports (AI-assisted — Phase 2–3, gated by D15 legal review; all drafts for confirmation, D9)

- I1 **Pre-visit brief**: one-paragraph digest of the file before each visit
- I2 **Lab trend narrative**: "Hb fell 1.2 g/dL in 6 wks despite iron" — computed numbers, AI wording
- I3 **Missing-data reminders**: per-file gap list (no anatomy scan at 24 wks; no TSH in infertility work-up)
- I4 **Natural-language clinical search**: "previous preterm birth AND current short cervix"
- I5 **Voice dictation** → structured visit entry (Egyptian Arabic / English medical terms)
- I6 **Prescribing-pattern insight**: "for anemia you prescribe X in n% of cases"
- I7 **Combination watch**: rising-BP trend + weight gain + complaint keywords → review prompt (reminder framing only — never diagnosis or treatment advice)
- I8 **Research cohort suggestions**: "43 files match X — viable study size?"
- I9 **AI Lab Reader** (already specified): photo/PDF → Review & Confirm → structured results

---

## 4. Data-model gaps surfaced by this design

The dashboards need four things the Phase-0 schema does not have. All are cheap to add **now** (Phase 1 migration) and expensive later:

| # | Gap | Needed by | Proposal |
|---|---|---|---|
| G1 | `appointments` table (date, time, patient, status, location) | DB1 today's list, no-shows, booking | ☑ Approved (Q11) — applied in migration `phase1_dashboard_fields` (D21) |
| G2 | `visits.nextVisitDate` (structured date; paper column "management & next visit" is currently text only) | DB2 overdue follow-ups, R6/R7 | ☑ Approved (Q12) — applied (D21) |
| G3 | `diagnoses` entity (episode-level coded problem + free text) | DB4 diagnosis distribution, research cohorts — ChatGPT discussion promised this | ☑ Approved (Q13) — applied (D21) |
| G4 | `location` on visits/episodes (he works across clinics) | DB1 per-clinic views | ☑ Approved (Q14) — applied (D21) |

**Priority update (D22, 2026-11-06):** DB4 (Prescribing) moved from Phase 3 to **Phase 2** at Dr. Ayman's request. Phase 2 dashboards: DB1 + DB2 + DB4. Phase 3: DB3 + DB5.
