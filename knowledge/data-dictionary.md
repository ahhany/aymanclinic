# Data Dictionary — Paper Forms → Database

Single source of truth for the Prisma schema. Every field on the two paper files is mapped here. Types are logical (Prisma-portable: no DB-specific types). `?` = optional.

## Shared: patient_identity (RESTRICTED table, separate access)

Paper section: "بيانات المريضة (تدون بمعرفتها)" — filled by the patient herself, identical on both files.

| Paper field (EN / AR) | Column | Type | Notes |
|---|---|---|---|
| NAME / اسم المريضة | full_name | text | required |
| AGE / السن | (derived) | — | computed from date_of_birth; paper shows age |
| — | date_of_birth | date? | more durable than age |
| ADDRESS / العنوان | address | text? | |
| MOBILE NO. / رقم المحمول | mobile | text? | search key |
| HUSB. NAME / اسم الزوج | husband_name | text? | |
| CODE | patient_code | text | clinic-wide sequential (D14), unique |

## Shared: obstetric_history (grid on both files' page 1)

Header: OBSTETRIC — YEAR · DURATION · PREGNANCY · COMP · MODE · POST-PARTUM. Paper has 4 rows; digital is unlimited.

| Paper column | Column | Type | Notes |
|---|---|---|---|
| YEAR | year | int? | |
| DURATION | duration | text? | pregnancy duration as written (e.g. "39 wks") |
| PREGNANCY | pregnancy_note | text? | |
| COMP | complications | text? | |
| MODE | delivery_mode | enum? | vaginal / CS / other |
| POST-PARTUM | post_partum | text? | |

## OBS file — page 1

| Paper field | Table · column | Type | Notes |
|---|---|---|---|
| Married For | episodes (or gyn/pregnancy details) · married_for | text? | shared field, also on GYN |
| Contraception | gyn_details · contraception | text? | shared field, also on GYN |
| Past / Family (history) | patients · past_history, family_history | text? | free text |
| **1st U/S**: GS, YS, FHP, EDD | ultrasound_milestones (type=first) · gs, ys, fhp, edd | bool?/bool?/bool?/date? | Operator & Place → operator, place (text?) |
| **11–13 wks scan**: Fetus, Placenta, Nasal B, Ductus, NT, Sex, EDD | ultrasound_milestones (type=nt_scan) · fetus, placenta, nasal_bone, ductus, nt_mm (decimal?), sex, edd | mixed | |
| **20 wks scan**: Anatomy, Placenta, Doppler UT.A, SEX, LIQ, CX, EDD | ultrasound_milestones (type=anatomy_scan) · anatomy, placenta, uterine_artery_doppler, sex, liquor, cervix, edd | mixed | |
| **Follow-up scans**: Biometry, Fetal Weight, Placenta, Liq, Remarks | ultrasound_milestones (type=followup) · biometry, fetal_weight_g (int?), placenta, liquor, remarks + scan_date | mixed | unlimited rows |
| **Delivery data**: Date Of Delivery, Hospital, Mode Of Delivery, Anesthesia, Maternal Comp., Fetal Comp, Fetal Sex | pregnancy_details · delivery_date, hospital, delivery_mode, anesthesia, maternal_complications, fetal_complications, fetal_sex | mixed | |
| **Post natal visit**: Date, Payment, Scar, Complications, Follow Up Ttt | pregnancy_details · postnatal_date, postnatal_payment, postnatal_scar, postnatal_complications, postnatal_followup_treatment | mixed | "Payment" is the only billing-adjacent field on paper; keep as text? |

## OBS file — page 2

| Paper field | Table · column | Type | Notes |
|---|---|---|---|
| Blood Group / RH Type | patients · blood_group, rh_type | enum? | A/B/AB/O · +/− |
| LMP / EDD | pregnancy_details · lmp_date, edd_date | date? | EDD derivable from LMP; both stored (paper records both) |
| **Visit grid** (14 paper rows): Date, WT (Kg), B/P, U/S, Complaints, Management And Next Visit | visits · visit_date, weight_kg (decimal?), bp_systolic (int?), bp_diastolic (int?), ultrasound_note (text?), complaints (text?), management (text?), next_visit (text?) | | unlimited rows; GA computed at visit_date from LMP |
| (structured, not on paper) | visits · next_visit_date (date?), location (text?) | | approved additions G2/G4 (D21) — overdue-follow-up alerts, per-clinic views |
| **Lab grid**: Date, HB %, ferritin, TLC, PLT, ALT, AST, Creat, Urea, PT, PC, FBS, PPBS, Urine, Ca++, TSH | lab_reports (report_date) → lab_results rows with test_codes: CBC_HB, FERRITIN, CBC_WBC (TLC), CBC_PLT, ALT, AST, CREATININE, UREA, PT, PC, FBS, PPBS, URINE_ANALYSIS, CALCIUM, TSH | | each result: value, unit, ref range, abnormal_flag, verification_status |

## GYN file — page 1

| Paper field | Table · column | Type | Notes |
|---|---|---|---|
| Married For / Contraception | gyn_details · married_for, contraception | text? | shared with OBS |
| MENSTRUAL: LMP | gyn_details · menstrual_history (text?), lmp_date (date?) | | |
| PAST / FAMILY | patients · past_history, family_history | text? | shared |
| **Semen Analysis**: LAB & DATE, Count, Motility A/B/C/D, Ab.Forms | semen_analyses (new table, 1..n per GYN episode) · lab_name, analysis_date, count_m_per_ml (decimal?), motility_a/b/c/d (decimal? %), abnormal_forms_pct (decimal?) | | unlimited rows |
| **1st Ultrasound**: Uterus, End. Thickness, Rt ovary, Lt ovary, Others | ultrasound_milestones (type=gyn_first) · uterus, endometrial_thickness_mm (decimal?), right_ovary, left_ovary, others | mixed | |
| Remarks | gyn_details · remarks | text? | |

## GYN file — page 2

| Paper field | Table · column | Type | Notes |
|---|---|---|---|
| **Follow-up grid** (10 paper rows): Date, Complaint, U/S, Management and next visit | visits · visit_date, complaints, ultrasound_note, management, next_visit | | same visits table as OBS |

## Derived / system fields (not on paper)

- `patients.anonymous_id` — research identifier (D11/D14).
- `visits.gestational_week / gestational_day` — computed from LMP at visit/sample date (never at data-entry date).
- `lab_results.normalized_value` — unit-normalized at query time (D10).
- `lab_reports.ai_extraction_status` — pending / reviewed / confirmed (D9).
- All tables: created_at, updated_at, created_by → audit_log.

## Approved Phase-1 additions (D21 — from the dashboard design gaps)

| Table · column | Type | Purpose |
|---|---|---|
| `appointments` (new table) | scheduled_at, status (scheduled/arrived/seen/no_show/cancelled), location?, reason?, patient FK, episode FK? | today's list, no-shows, booking (DB1) |
| `visits.next_visit_date` | date? | overdue-follow-up alerts (DB2); complements free-text next_visit |
| `visits.location`, `episodes.location` | text? | per-clinic dashboards |
| `diagnoses` (new table) | label, code? (future ICD-10), status (active/resolved), diagnosed_at, episode FK | diagnosis distribution & research cohorts (DB4) |

## Seed data: test_definitions (initial panel)

CBC_HB, CBC_HCT, CBC_RBC, CBC_MCV, CBC_MCH, CBC_MCHC, CBC_RDW, CBC_WBC (display "TLC"), CBC_PLT, FERRITIN, SERUM_IRON, ALT, AST, CREATININE, UREA, PT, PC, FBS, PPBS, URINE_ANALYSIS, CALCIUM, TSH — each with default unit and reference range; panel grouping: CBC basic / CBC extended / OBS lab row / additional.

## Approved Phase-1 additions (D26 — rich outcomes, migration `phase1_rich_outcomes`)

| Table · column | Type | Purpose |
|---|---|---|
| `newborns` (new table) | episode FK, sort_order, sex?, birth_weight_g?, apgar1?, apgar5?, nicu_admission? | per-baby outcomes incl. twins (E1) |
| `pregnancy_details.outcome` / `outcome_date` / `outcome_ga_weeks` | text? / date? / int? | miscarriage & stillbirth visibility, loss-rate analytics (E2) |
| `pregnancy_details.labour_onset` / `cs_urgency` / `cs_indication` | text? | elective vs emergency CS analytics (E3) |
| `patients.height_cm` | float? | BMI + weight-gain analytics (E5) |
| `diagnoses.category` | text? (risk_factor / general) | high-risk board stratification (E6) |
