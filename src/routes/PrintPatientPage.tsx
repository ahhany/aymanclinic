// Print-to-PDF patient file (/patients/:id/print) — standalone route, no app
// shell. Renders the whole record as an A4 document mirroring the paper file's
// section order (knowledge/data-dictionary.md) and auto-invokes window.print().

import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../db/apiClient';
import type { EpisodeDto, LabReportDto, PatientDetailDto } from '../db/types';
import { useI18n } from '../i18n';
import { MODULE_LABELS, SECTIONS } from '../i18n/sections';
import { ageFromDob, formatDate } from '../lib/dates';
import { gestationalAgeAt } from '../lib/clinical/ga';
import { ULTRASOUND_FIELDS, ULTRASOUND_TYPE_LABELS, type UltrasoundType } from '../lib/ultrasound';
import { Button } from '../components/ui/button';
import '../styles/print.css';

// The shared DTOs predate a few fields the detail GET already returns —
// widen locally rather than touching src/db/types.ts (owned elsewhere).
type PrintLabResult = LabReportDto['results'][number] & {
  resultText: string | null;
  refLow: number | null;
  refHigh: number | null;
};
type PrintLabReport = Omit<LabReportDto, 'results'> & {
  episodeId: string | null;
  results: PrintLabResult[];
};
type PrintPrescription = EpisodeDto['prescriptions'][number] & {
  route: string | null;
  durationDays: number | null;
};
type PrintPregnancy = NonNullable<EpisodeDto['pregnancy']> & { marriedFor: string | null };
type PrintEpisode = Omit<EpisodeDto, 'prescriptions' | 'pregnancy'> & {
  pregnancy: PrintPregnancy | null;
  prescriptions: PrintPrescription[];
};
type PrintPatient = Omit<PatientDetailDto, 'episodes' | 'labReports'> & {
  createdAt: string;
  episodes: PrintEpisode[];
  labReports: PrintLabReport[];
};

// Bilingual labels mirroring the paper file (D13). Section headers render BOTH
// languages (fixed-layout document); field labels follow the UI language.
const L = {
  clinicName: ['Dr. Ayman Hany — Obstetrics & Gynecology', 'د. أيمن هاني — أمراض النساء والتوليد'],
  patientFile: ['Patient File', 'ملف المريضة'],
  print: ['Print / Save as PDF', 'طباعة / حفظ PDF'],
  back: ['Back to file', 'عودة إلى الملف'],
  printedOn: ['Printed on', 'تاريخ الطباعة'],
  registered: ['Registered', 'تاريخ التسجيل'],
  name: ['Name', 'اسم المريضة'],
  code: ['Code', 'الكود'],
  age: ['Age', 'السن'],
  dob: ['Date of birth', 'تاريخ الميلاد'],
  mobile: ['Mobile', 'رقم المحمول'],
  address: ['Address', 'العنوان'],
  husband: ['Husband', 'اسم الزوج'],
  bloodGroup: ['Blood group / RH', 'فصيلة الدم'],
  pastHistory: ['Past history', 'التاريخ المرضي'],
  familyHistory: ['Family history', 'تاريخ العائلة'],
  year: ['Year', 'السنة'],
  duration: ['Duration', 'المدة'],
  pregnancyCol: ['Pregnancy', 'الحمل'],
  comp: ['Comp', 'مضاعفات'],
  mode: ['Mode', 'طريقة الولادة'],
  postPartum: ['Post-partum', 'ما بعد الولادة'],
  lmp: ['LMP', 'آخر دورة شهرية'],
  edd: ['EDD', 'التاريخ المتوقع للولادة'],
  gpa: ['G / P / A', 'حمل / ولادة / إجهاض'],
  marriedFor: ['Married for', 'متزوجة منذ'],
  contraception: ['Contraception', 'وسيلة تنظيم الأسرة'],
  menstrual: ['Menstrual', 'الدورة الشهرية'],
  remarks: ['Remarks', 'ملاحظات'],
  date: ['Date', 'التاريخ'],
  wt: ['Wt (kg)', 'الوزن (كجم)'],
  bp: ['B/P', 'ضغط الدم'],
  ga: ['GA', 'عمر الحمل'],
  usNote: ['U/S', 'سونار'],
  complaints: ['Complaints', 'الشكاوى'],
  management: ['Management', 'العلاج'],
  nextVisit: ['Next visit', 'الزيارة القادمة'],
  test: ['Test', 'التحليل'],
  result: ['Result', 'النتيجة'],
  unit: ['Unit', 'الوحدة'],
  ref: ['Reference', 'المعدل المرجعي'],
  flag: ['Flag', 'مؤشر'],
  diagnoses: ['Diagnoses', 'التشخيصات'],
  medication: ['Medication', 'الدواء'],
  dose: ['Dose', 'الجرعة'],
  frequency: ['Frequency', 'التكرار'],
  durationDays: ['Duration', 'المدة'],
  days: ['days', 'يوم'],
  indication: ['Indication', 'الاستطباب'],
  deliveryDate: ['Date of delivery', 'تاريخ الولادة'],
  hospital: ['Hospital', 'المستشفى'],
  deliveryMode: ['Mode of delivery', 'طريقة الولادة'],
  anesthesia: ['Anesthesia', 'التخدير'],
  maternalComp: ['Maternal comp.', 'مضاعفات الأم'],
  fetalComp: ['Fetal comp.', 'مضاعفات الجنين'],
  fetalSex: ['Fetal sex', 'نوع الجنين'],
  postnatalDate: ['Postnatal date', 'تاريخ زيارة ما بعد الولادة'],
  payment: ['Payment', 'الدفع'],
  scar: ['Scar', 'الجرح'],
  postnatalComp: ['Complications', 'المضاعفات'],
  followupTtt: ['Follow-up ttt', 'علاج المتابعة'],
  labAndDate: ['Lab & date', 'المعمل والتاريخ'],
  count: ['Count (M/ml)', 'العدد (مليون/مل)'],
  motility: ['Motility A/B/C/D', 'الحركة أ/ب/ج/د'],
  abForms: ['Ab. forms', 'الأشكال الشاذة'],
  status: ['Status', 'الحالة'],
  operator: ['Operator', 'الطبيب'],
  place: ['Place', 'المكان'],
  labGeneral: ['Laboratory (not linked to an episode)', 'تحاليل غير مرتبطة بزيارة'],
} as const;

type LKey = keyof typeof L;
type Pick = (k: LKey) => string;

function Heading({ pair }: { pair: readonly string[] }) {
  return (
    <h2 className="print-heading">
      <span>{pair[0]}</span>
      <span className="ar">{pair[1]}</span>
    </h2>
  );
}

function KV({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="print-kv">
      <span className="k">{label}</span>
      <span>{value == null || value === '' ? '—' : value}</span>
    </div>
  );
}

function LabReportPrint({ report, p }: { report: PrintLabReport; p: Pick }) {
  return (
    <div className="print-section">
      <p className="font-semibold text-clinic-navy">
        {formatDate(report.reportDate)} · {report.laboratoryName ?? '—'}
      </p>
      <table className="print-table">
        <thead>
          <tr>
            <th>{p('test')}</th>
            <th>{p('result')}</th>
            <th>{p('unit')}</th>
            <th>{p('ref')}</th>
            <th>{p('flag')}</th>
          </tr>
        </thead>
        <tbody>
          {report.results.map((r) => {
            const flagged = r.abnormalFlag === 'low' || r.abnormalFlag === 'high';
            const arrow = r.abnormalFlag === 'low' ? '↓' : r.abnormalFlag === 'high' ? '↑' : '';
            const value = r.resultValue != null ? String(r.resultValue) : (r.resultText ?? '—');
            const refRange =
              r.refLow != null || r.refHigh != null ? `${r.refLow ?? ''} – ${r.refHigh ?? ''}` : '—';
            return (
              <tr key={r.id} className={flagged ? 'print-flag' : undefined}>
                <td>{r.testName}</td>
                <td>
                  {value}
                  {arrow ? ` ${arrow}` : ''}
                </td>
                <td>{r.unit ?? '—'}</td>
                <td>{refRange}</td>
                <td>{r.abnormalFlag ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UltrasoundPrint({ u }: { u: EpisodeDto['ultrasounds'][number] }) {
  const typeLabel = ULTRASOUND_TYPE_LABELS[u.type as UltrasoundType] ?? u.type;
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(u.payloadJson) as Record<string, unknown>;
  } catch {
    /* malformed payload — render header only */
  }
  const fields = ULTRASOUND_FIELDS[u.type as UltrasoundType] ?? [];
  return (
    <div className="print-section">
      <p className="font-semibold text-clinic-navy">
        {typeLabel} · {formatDate(u.scanDate)}
        {u.operator ? ` · ${u.operator}` : ''}
        {u.place ? ` (${u.place})` : ''}
      </p>
      <p className="print-muted">
        {fields
          .filter((f) => payload[f.key] !== undefined)
          .map((f) => `${f.label}: ${payload[f.key] === true ? '✓' : String(payload[f.key])}`)
          .join(' · ') || '—'}
      </p>
    </div>
  );
}

function EpisodePrint({ episode, labReports, p }: { episode: PrintEpisode; labReports: PrintLabReport[]; p: Pick }) {
  const isObs = episode.type === 'OBS';
  const preg = episode.pregnancy;
  const gyn = episode.gyn;
  const lmp = preg?.lmpDate ?? null;
  const hasDelivery = !!(preg?.deliveryDate || preg?.hospital || preg?.deliveryMode);
  const hasPostnatal = !!(preg?.postnatalDate || preg?.postnatalScar || preg?.postnatalComplications);
  const episodeLabs = labReports.filter((r) => r.episodeId === episode.id);

  return (
    <section>
      <div className="print-section">
        <Heading pair={[MODULE_LABELS[episode.type]?.[0] ?? episode.type, MODULE_LABELS[episode.type]?.[1] ?? '']} />
        <div className="print-kv-grid">
          <KV label={p('status')} value={episode.status} />
          {isObs ? (
            <>
              <KV label={p('lmp')} value={formatDate(lmp)} />
              <KV label={p('edd')} value={formatDate(preg?.eddDate)} />
              <KV
                label={p('gpa')}
                value={`${preg?.gravida ?? '—'} / ${preg?.parity ?? '—'} / ${preg?.abortions ?? '—'}`}
              />
              <KV label={p('marriedFor')} value={preg?.marriedFor} />
            </>
          ) : (
            <>
              <KV label={p('marriedFor')} value={gyn?.marriedFor} />
              <KV label={p('contraception')} value={gyn?.contraception} />
              <KV label={p('menstrual')} value={gyn?.menstrualHistory} />
              <KV label={p('remarks')} value={gyn?.remarks} />
            </>
          )}
        </div>
      </div>

      {episode.diagnoses.length > 0 && (
        <div className="print-section">
          <Heading pair={L.diagnoses} />
          <ul>
            {episode.diagnoses.map((d) => (
              <li key={d.id}>
                {d.label} <span className="print-muted">({d.status} · {formatDate(d.diagnosedAt)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {episode.visits.length > 0 && (
        <div className="print-section">
          <Heading pair={isObs ? SECTIONS.visits : SECTIONS.followUps} />
          <table className="print-table">
            <thead>
              <tr>
                <th>{p('date')}</th>
                <th>{p('wt')}</th>
                <th>{p('bp')}</th>
                {isObs && <th>{p('ga')}</th>}
                <th>{p('usNote')}</th>
                <th>{p('complaints')}</th>
                <th>{p('management')}</th>
                <th>{p('nextVisit')}</th>
              </tr>
            </thead>
            <tbody>
              {episode.visits.map((v) => {
                const ga = isObs && lmp ? gestationalAgeAt(new Date(lmp), new Date(v.visitDate)) : null;
                return (
                  <tr key={v.id}>
                    <td>{formatDate(v.visitDate)}</td>
                    <td>{v.weightKg ?? '—'}</td>
                    <td>{v.bpSystolic != null && v.bpDiastolic != null ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}</td>
                    {isObs && <td>{ga ? `${ga.weeks}+${ga.days}` : '—'}</td>}
                    <td>{v.ultrasoundNote ?? '—'}</td>
                    <td>{v.complaints ?? '—'}</td>
                    <td>{v.management ?? '—'}</td>
                    <td>{v.nextVisitDate ? formatDate(v.nextVisitDate) : (v.nextVisit ?? '—')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {episode.ultrasounds.length > 0 && (
        <div>
          <Heading pair={SECTIONS.ultrasounds} />
          {episode.ultrasounds.map((u) => (
            <UltrasoundPrint key={u.id} u={u} />
          ))}
        </div>
      )}

      {!isObs && episode.semenAnalyses.length > 0 && (
        <div className="print-section">
          <Heading pair={SECTIONS.semenAnalysis} />
          <table className="print-table">
            <thead>
              <tr>
                <th>{p('labAndDate')}</th>
                <th>{p('count')}</th>
                <th>{p('motility')}</th>
                <th>{p('abForms')}</th>
              </tr>
            </thead>
            <tbody>
              {episode.semenAnalyses.map((s) => (
                <tr key={s.id}>
                  <td>
                    {s.labName ?? '—'} · {formatDate(s.analysisDate)}
                  </td>
                  <td>{s.countMPerMl ?? '—'}</td>
                  <td>
                    {s.motilityAPct ?? '—'} / {s.motilityBPct ?? '—'} / {s.motilityCPct ?? '—'} / {s.motilityDPct ?? '—'}
                  </td>
                  <td>{s.abnormalFormsPct != null ? `${s.abnormalFormsPct}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {episodeLabs.length > 0 && (
        <div>
          <Heading pair={SECTIONS.labs} />
          {episodeLabs.map((r) => (
            <LabReportPrint key={r.id} report={r} p={p} />
          ))}
        </div>
      )}

      {episode.prescriptions.length > 0 && (
        <div className="print-section">
          <Heading pair={SECTIONS.medications} />
          <table className="print-table">
            <thead>
              <tr>
                <th>{p('date')}</th>
                <th>{p('medication')}</th>
                <th>{p('dose')}</th>
                <th>{p('frequency')}</th>
                <th>{p('durationDays')}</th>
                <th>{p('indication')}</th>
              </tr>
            </thead>
            <tbody>
              {episode.prescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td>{formatDate(rx.prescriptionDate)}</td>
                  <td>
                    {rx.medication.brandName}
                    {rx.medication.strength ? ` ${rx.medication.strength}` : ''}
                    <span className="print-muted"> ({rx.medication.activeIngredient})</span>
                  </td>
                  <td>{rx.dose ?? '—'}</td>
                  <td>{rx.frequency ?? '—'}</td>
                  <td>{rx.durationDays != null ? `${rx.durationDays} ${p('days')}` : '—'}</td>
                  <td>{rx.indication ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isObs && hasDelivery && (
        <div className="print-section">
          <Heading pair={SECTIONS.delivery} />
          <div className="print-kv-grid">
            <KV label={p('deliveryDate')} value={formatDate(preg?.deliveryDate)} />
            <KV label={p('hospital')} value={preg?.hospital} />
            <KV label={p('deliveryMode')} value={preg?.deliveryMode} />
            <KV label={p('anesthesia')} value={preg?.anesthesia} />
            <KV label={p('maternalComp')} value={preg?.maternalComplications} />
            <KV label={p('fetalComp')} value={preg?.fetalComplications} />
            <KV label={p('fetalSex')} value={preg?.fetalSex} />
          </div>
        </div>
      )}

      {isObs && hasPostnatal && (
        <div className="print-section">
          <Heading pair={SECTIONS.postnatal} />
          <div className="print-kv-grid">
            <KV label={p('postnatalDate')} value={formatDate(preg?.postnatalDate)} />
            <KV label={p('payment')} value={preg?.postnatalPayment} />
            <KV label={p('scar')} value={preg?.postnatalScar} />
            <KV label={p('postnatalComp')} value={preg?.postnatalComplications} />
            <KV label={p('followupTtt')} value={preg?.postnatalFollowupTtt} />
          </div>
        </div>
      )}
    </section>
  );
}

export function PrintPatientPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { lang } = useI18n();
  const [patient, setPatient] = useState<PrintPatient | null>(null);
  const [error, setError] = useState(false);
  const printedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<PrintPatient>(`patients/${id}`)
      .then(setPatient)
      .catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Auto-open the print dialog once the data has rendered — fires exactly once.
  useEffect(() => {
    if (!patient || printedRef.current) return;
    printedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 500);
    return () => window.clearTimeout(timer);
  }, [patient]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="font-semibold text-clinic-red">Could not load this patient file</p>
        <Link to={id ? `/patients/${id}` : '/'} className="text-sm text-clinic-blue hover:underline">
          ← Back
        </Link>
      </div>
    );
  }
  if (!patient) return <p className="p-8 text-center text-slate-400">Loading…</p>;

  const p: Pick = (k) => L[k][lang === 'ar' ? 1 : 0];
  const age = ageFromDob(patient.dateOfBirth);
  const episodeIds = new Set(patient.episodes.map((e) => e.id));
  const unlinkedLabs = patient.labReports.filter((r) => !r.episodeId || !episodeIds.has(r.episodeId));

  return (
    <div>
      {/* Screen-only toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-clinic-line bg-white px-4 py-2 print:hidden">
        <Link to={`/patients/${patient.id}`} className="text-sm text-clinic-blue hover:underline">
          ← {p('back')}
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          {p('print')}
        </Button>
      </div>

      <div className="print-sheet">
        {/* Document header — clinic identity + patient code/name/dates */}
        <header className="print-section" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '14pt', fontWeight: 800, color: 'var(--color-clinic-navy)' }}>{L.clinicName[0]}</h1>
          <p style={{ fontSize: '11pt', color: 'var(--color-clinic-blue)' }}>{L.clinicName[1]}</p>
          <p style={{ marginTop: '4pt', fontWeight: 700 }}>
            {L.patientFile[0]} · {L.patientFile[1]}
          </p>
          <div className="print-kv-grid" style={{ marginTop: '6pt', textAlign: 'left' }}>
            <KV label={p('code')} value={patient.patientCode} />
            <KV label={p('name')} value={patient.identity?.fullName} />
            <KV label={p('registered')} value={formatDate(patient.createdAt)} />
            <KV label={p('printedOn')} value={formatDate(new Date().toISOString())} />
          </div>
        </header>

        {/* Identity block — mirrors "بيانات المريضة" on both paper files */}
        <div className="print-section">
          <Heading pair={SECTIONS.patientData} />
          <div className="print-kv-grid">
            <KV label={p('name')} value={patient.identity?.fullName} />
            <KV label={p('age')} value={age != null ? age : '—'} />
            <KV label={p('dob')} value={formatDate(patient.dateOfBirth)} />
            <KV label={p('mobile')} value={patient.identity?.mobile} />
            <KV label={p('address')} value={patient.identity?.address} />
            <KV label={p('husband')} value={patient.identity?.husbandName} />
            <KV
              label={p('bloodGroup')}
              value={patient.bloodGroup ? `${patient.bloodGroup} ${patient.rhType ?? ''}`.trim() : '—'}
            />
            <KV label={p('pastHistory')} value={patient.pastHistory} />
            <KV label={p('familyHistory')} value={patient.familyHistory} />
          </div>
        </div>

        {/* Obstetric history grid (both paper files, page 1) */}
        {patient.obstetricHistory.length > 0 && (
          <div className="print-section">
            <Heading pair={SECTIONS.obstetricHistory} />
            <table className="print-table">
              <thead>
                <tr>
                  <th>{p('year')}</th>
                  <th>{p('duration')}</th>
                  <th>{p('pregnancyCol')}</th>
                  <th>{p('comp')}</th>
                  <th>{p('mode')}</th>
                  <th>{p('postPartum')}</th>
                </tr>
              </thead>
              <tbody>
                {patient.obstetricHistory.map((r) => (
                  <tr key={r.id}>
                    <td>{r.year ?? '—'}</td>
                    <td>{r.duration ?? '—'}</td>
                    <td>{r.pregnancyNote ?? '—'}</td>
                    <td>{r.complications ?? '—'}</td>
                    <td>{r.deliveryMode ?? '—'}</td>
                    <td>{r.postPartum ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Episodes in paper order */}
        {patient.episodes.map((ep) => (
          <EpisodePrint key={ep.id} episode={ep} labReports={patient.labReports} p={p} />
        ))}

        {/* Lab reports not linked to any episode */}
        {unlinkedLabs.length > 0 && (
          <div>
            <Heading pair={L.labGeneral} />
            {unlinkedLabs.map((r) => (
              <LabReportPrint key={r.id} report={r} p={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
