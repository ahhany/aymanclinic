# Open Questions

Status: ☐ open · ☑ answered. Answers are written here (with date) and the affected knowledge/plan files updated in the same change.

| # | Question | For | Status |
|---|---|---|---|
| Q1 | Primary usage during examination: tablet landscape + keyboard & stylus / tablet + laptop alternately / mainly laptop? (Drives layout density decisions.) | Dr. Ayman | ☐ |
| Q2 | Layout fidelity sign-off: after the first hybrid OBS/GYN screens are built, confirm hybrid vs closer-to-paper replica. | Dr. Ayman | ☐ |
| Q3 | Who else needs accounts — receptionist, assistant, second doctor? What should each role see/do? | Dr. Ayman | ☐ |
| Q4 | Internet reliability at each clinic — is full offline mode a Phase-2 must or nice-to-have? | Dr. Ayman | ☐ |
| Q5 | Historical paper records: back-enter old patients, or start digital from go-live day only? If back-entry: roughly how many files, and who types them? | Dr. Ayman | ☐ |
| Q6 | Supabase production project: created under whose account (Dr. Ayman's recommended — he owns the data), and who administers it? | Ahmed / Dr. Ayman | ☐ |
| Q7 | Medication catalogue seeding: start empty and let the personal library grow naturally, or pre-load a list of Dr. Ayman's most-prescribed drugs (if he provides one)? | Dr. Ayman | ☐ |
| Q8 | UI language for v1: bilingual labels mirroring the paper (D13) — acceptable, or should the whole UI switch Arabic/English? | Dr. Ayman | ☐ |
| Q9 | Postnatal "Payment" field on the OBS paper file — keep as a plain text field (current mapping), or drop it from the digital file? | Dr. Ayman | ☐ |
| Q10 | AI Lab Reader go-live: which provider is acceptable after legal review (OpenAI / Anthropic / Gemini), given DPA availability? | Ahmed | ☐ |
| Q11 | Approve adding an `appointments` table (needed for "today's list", no-shows, booking — dashboards gap G1)? | Dr. Ayman | ☐ |
| Q12 | Approve a structured `nextVisitDate` on visits alongside the free-text "management & next visit" (enables overdue-follow-up alerts — gap G2)? | Dr. Ayman | ☐ |
| Q13 | Approve a `diagnoses` entity per episode (coded problem + free text) — needed for diagnosis-distribution statistics promised in the ChatGPT discussion (gap G3)? | Dr. Ayman | ☐ |
| Q14 | Does he want a `location` field (which clinic the visit happened at) for per-branch dashboards (gap G4)? | Dr. Ayman | ☐ |
| Q15 | Dashboard priority check: DB1 Operations + DB2 High-Risk Board proposed for Phase 2; DB3 Outcomes + DB4 Prescribing for Phase 3 — does this match what he wants to see first? | Dr. Ayman / Ahmed | ☐ |
