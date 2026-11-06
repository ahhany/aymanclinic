# Data-Model Enhancement Proposals — Optional Fields for Richer Analytics

Drafted 2026-11-06, before the first GitHub push. Status: **proposals — nothing built yet**. Each item lists the schema change, why it matters, and which dashboards/reports it unlocks (references: `dashboards-and-reports.md`). All fields are OPTIONAL at entry time (D7: structured when present, never blocking); Dr. Ayman can ignore any of them and the system behaves exactly as today. Rule of thumb: adding a column now (empty database) is a one-line migration; adding it after a year of real records means re-keying history.

Ranked by analytical value per entry effort.

---

## Tier 1 — cheap fields, big analytical jumps

| # | Enhancement | Schema change | Unlocks |
|---|---|---|---|
| E1 | **Newborn outcomes table** (`newborns`: episode FK, sex, birthWeightG, apgar1, apgar5, nicuAdmission bool) — replaces the single `fetalSex` text field; supports twins | new table | Birth-weight distribution, SGA/IUGR rates, low-birth-weight vs anemia correlation, NICU rate, twin handling. Core of DB3 and almost any research question. **Highest research value per pound.** |
| E2 | **Pregnancy outcome for non-delivery endings** (`pregnancy_details.outcome`: ongoing / liveBirth / miscarriage / stillbirth / TOP + `outcomeDate`, `outcomeGaWeeks`?) | 2–3 columns | Pregnancy-loss rate by trimester, recurrent-miscarriage cohorts (R20 done properly), "what happened to every pregnancy" completeness (R32). Today a miscarriage just silently stops. |
| E3 | **CS detail** (`pregnancy_details.labourOnset`: spontaneous / induced / electiveCS + `csIndication` text + `csUrgency`: elective / emergency) | 3 columns | Elective vs emergency CS split, CS rate over time *with reasons* (R18, DB3) — the single most-watched quality metric in OB practice. |
| E4 | **Urine protein at visit** (`visits.urineProtein`: neg/trace/+/++/+++) | 1 column | Pre-eclampsia watch = BP + protein + weight trend (I7 combination watch becomes real, not just BP). |
| E5 | **Maternal height + BMI** (`patients.heightCm`; BMI computed from first-visit weight) | 1 column | BMI-category casemix, pregnancy weight-gain curves vs IOM guidelines, gestational-weight-gain outliers. Weight is already collected per visit — height is the missing multiplier. |
| E6 | **Risk-factor picklist on pregnancies** (seeded coded list: chronic HTN, pre-eclampsia history, GDM history, previous preterm, previous CS, thrombophilia, multiple gestation…; implemented as `diagnoses` rows with `category='risk_factor'` — needs only `diagnoses.category` column) | 1 column + seed data | DB2 becomes a true high-risk board (filter/sort by risk factor); risk-factor prevalence; outcomes stratified by risk. |
| E7 | **Referral source** (`patients.referralSource` text/picklist: self, patient referral, doctor referral, social media…) | 1 column | Where patients come from (DB1 administration), growth/marketing insight. |

## Tier 2 — GYN / infertility depth

| # | Enhancement | Schema change | Unlocks |
|---|---|---|---|
| E8 | **Structured infertility fields** (`gyn_details.infertilityType`: primary/secondary, `infertilityYears` int — today only free-text `marriedFor`) | 2 columns | R26 primary-vs-secondary properly, duration-of-infertility distribution. |
| E9 | **HSG / tubal-factor result** (`gyn_details.hsgResult`: notDone/patent/unilateral/bilateralBlock + date) | 2 columns | Infertility work-up completeness (R25), male-vs-tubal-vs-unexplained factor split. |
| E10 | **Semen analysis context** (`semen_analyses.abstinenceDays` int?) | 1 column | Interpreting SA values (WHO requires 2–7 days); better R24 quality. |

## Tier 3 — no schema change needed (data-only, D8)

| # | Enhancement | How | Unlocks |
|---|---|---|---|
| E11 | **OGTT & HbA1c test definitions** (OGTT_FASTING, OGTT_1H, OGTT_2H, HBA1C, URINE_PROTEIN_LAB) | rows in `test_definitions` | Proper GDM screening/diagnosis analytics (R14, R15) — FBS-only is weak. |
| E12 | **Risk-factor & common-diagnosis seed lists** for the diagnoses picklist | seed rows | Faster, consistent diagnosis entry → cleaner DB4 distribution. |

## Deferred / bigger decisions (list only — needs discussion)

- **ICSI module details** (`icsi_details`: protocol, oocytes, fertilization, embryos transferred, cycle outcome) — a full module of its own; build when Dr. Ayman wants ICSI tracking for real.
- **Payments table** (amount, method, date, visit FK) — revenue analytics; the paper only has one "Payment" text field. Decide whether the clinic wants billing in scope at all.
- **Visit service type** (`visits.serviceType`: routine / scan-only / consultation / procedure) — productivity analytics; pairs naturally with payments later.

## Entry UX principle (if approved)

Optional fields appear as a collapsible "More details (optional)" affordance on the forms Dr. Ayman already uses — never new mandatory screens. DB3/DB5 widgets simply show "not enough data" until he starts filling them.
