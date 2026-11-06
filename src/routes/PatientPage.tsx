import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../db/apiClient';
import type { EpisodeDto, PatientDetailDto, UltrasoundMilestoneDto } from '../db/types';
import { useI18n } from '../i18n';
import { MODULE_LABELS } from '../i18n/sections';
import { Section } from '../components/Section';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AddVisitForm } from '../components/forms/AddVisitForm';
import { AddLabReportForm } from '../components/forms/AddLabReportForm';
import { DiagnosisList } from '../components/forms/DiagnosisList';
import { AddObstetricRowForm } from '../components/forms/AddObstetricRowForm';
import { AddUltrasoundForm } from '../components/forms/AddUltrasoundForm';
import { DeliveryForm } from '../components/forms/DeliveryForm';
import { PrescribeForm } from '../components/forms/PrescribeForm';
import { AttachmentsSection, type AttachmentDto } from '../components/AttachmentsSection';
import { ageFromDob, formatDate } from '../lib/dates';
import { gestationalAgeAt } from '../lib/clinical/ga';
import { ULTRASOUND_FIELDS, ULTRASOUND_TYPE_LABELS, type UltrasoundType } from '../lib/ultrasound';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="min-w-28 font-medium text-clinic-steel">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

function VisitsTable({ episode, showGa }: { episode: EpisodeDto; showGa: boolean }) {
  const lmp = episode.pregnancy?.lmpDate;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-clinic-line text-left text-clinic-steel">
          <th className="py-1 pe-2">Date</th>
          <th className="py-1 pe-2">Wt (kg)</th>
          <th className="py-1 pe-2">B/P</th>
          {showGa && <th className="py-1 pe-2">GA</th>}
          <th className="py-1 pe-2">Complaints</th>
          <th className="py-1 pe-2">Management</th>
          <th className="py-1">Next visit</th>
        </tr>
      </thead>
      <tbody>
        {episode.visits.map((v) => {
          const ga = showGa && lmp ? gestationalAgeAt(new Date(lmp), new Date(v.visitDate)) : null;
          return (
            <tr key={v.id} className="border-b border-clinic-line/60 last:border-0">
              <td className="py-1.5 pe-2 whitespace-nowrap">{formatDate(v.visitDate)}</td>
              <td className="py-1.5 pe-2">{v.weightKg ?? '—'}</td>
              <td className="py-1.5 pe-2">
                {v.bpSystolic != null && v.bpDiastolic != null ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}
              </td>
              {showGa && <td className="py-1.5 pe-2">{ga ? `${ga.weeks}+${ga.days}` : '—'}</td>}
              <td className="py-1.5 pe-2">{v.complaints ?? '—'}</td>
              <td className="py-1.5 pe-2">{v.management ?? '—'}</td>
              <td className="py-1.5 whitespace-nowrap">{formatDate(v.nextVisitDate)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function UltrasoundRow({ u }: { u: UltrasoundMilestoneDto }) {
  const label = ULTRASOUND_TYPE_LABELS[u.type as UltrasoundType] ?? u.type;
  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(u.payloadJson) as Record<string, unknown>;
  } catch {
    /* malformed payload — render header only */
  }
  const fields = ULTRASOUND_FIELDS[u.type as UltrasoundType] ?? [];
  const summary = fields
    .filter((f) => payload[f.key] !== undefined)
    .map((f) => `${f.label}: ${payload[f.key] === true ? '✓' : String(payload[f.key])}`)
    .join(' · ');
  return (
    <div className="text-sm">
      <p className="font-medium text-clinic-steel">
        {label} · {formatDate(u.scanDate)}
        {u.operator ? ` · ${u.operator}` : ''}
        {u.place ? ` (${u.place})` : ''}
      </p>
      {summary && <p className="text-slate-600">{summary}</p>}
    </div>
  );
}

function EpisodeCard({ episode, onReload }: { episode: EpisodeDto; onReload: () => void }) {
  const { t } = useI18n();
  const [addingVisit, setAddingVisit] = useState(false);
  const [addingUS, setAddingUS] = useState(false);
  const [addingRx, setAddingRx] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const p = episode.pregnancy;
  const g = episode.gyn;
  const isObs = episode.type === 'OBS';
  const gaToday = p?.lmpDate ? gestationalAgeAt(new Date(p.lmpDate), new Date()) : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 bg-clinic-navy px-4 py-1.5 text-sm font-semibold text-white">
        <span>{MODULE_LABELS[episode.type]?.[0] ?? episode.type}</span>
        <span className="text-white/60">{MODULE_LABELS[episode.type]?.[1]}</span>
        {episode.location && <span className="text-xs text-white/60">· {episode.location}</span>}
        <span className="ms-auto rounded bg-white/15 px-2 py-0.5 text-xs">{episode.status}</span>
      </div>
      <div className="space-y-3 p-3">
        <DiagnosisList episodeId={episode.id} diagnoses={episode.diagnoses} onSaved={onReload} />

        <Section section="history" defaultOpen>
          {isObs ? (
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <Field label="LMP" value={formatDate(p?.lmpDate)} />
              <Field label="EDD" value={formatDate(p?.eddDate)} />
              <Field label="G / P / A" value={`${p?.gravida ?? '—'} / ${p?.parity ?? '—'} / ${p?.abortions ?? '—'}`} />
              <Field label="GA today" value={gaToday ? `${gaToday.weeks}+${gaToday.days} wks` : '—'} />
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
              <Field label="Married for" value={g?.marriedFor} />
              <Field label="Contraception" value={g?.contraception} />
              <Field label="Menstrual" value={g?.menstrualHistory} />
            </div>
          )}
        </Section>

        <Section section="ultrasounds" defaultOpen={episode.ultrasounds.length > 0}>
          {episode.ultrasounds.length > 0 && (
            <div className="mb-2 space-y-2">
              {episode.ultrasounds.map((u) => (
                <UltrasoundRow key={u.id} u={u} />
              ))}
            </div>
          )}
          {addingUS ? (
            <AddUltrasoundForm
              episodeId={episode.id}
              module={episode.type}
              onSaved={() => {
                setAddingUS(false);
                onReload();
              }}
            />
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddingUS(true)}>
                + U/S · سونار
              </Button>
            </div>
          )}
        </Section>

        {!isObs && episode.semenAnalyses.length > 0 && (
          <Section section="semenAnalysis" defaultOpen>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-clinic-line text-left text-clinic-steel">
                  <th className="py-1 pe-2">Lab & date</th>
                  <th className="py-1 pe-2">Count</th>
                  <th className="py-1 pe-2">A / B / C / D</th>
                  <th className="py-1">Ab. forms</th>
                </tr>
              </thead>
              <tbody>
                {episode.semenAnalyses.map((s) => (
                  <tr key={s.id} className="border-b border-clinic-line/60 last:border-0">
                    <td className="py-1.5 pe-2">
                      {s.labName ?? '—'} · {formatDate(s.analysisDate)}
                    </td>
                    <td className="py-1.5 pe-2">{s.countMPerMl ?? '—'}</td>
                    <td className="py-1.5 pe-2">
                      {s.motilityAPct ?? '—'} / {s.motilityBPct ?? '—'} / {s.motilityCPct ?? '—'} / {s.motilityDPct ?? '—'}
                    </td>
                    <td className="py-1.5">{s.abnormalFormsPct != null ? `${s.abnormalFormsPct}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        <Section section={isObs ? 'visits' : 'followUps'} defaultOpen>
          <VisitsTable episode={episode} showGa={isObs} />
          {addingVisit ? (
            <AddVisitForm
              episodeId={episode.id}
              onSaved={() => {
                setAddingVisit(false);
                onReload();
              }}
            />
          ) : (
            <div className="mt-2 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddingVisit(true)}>
                + {t('addVisit')}
              </Button>
            </div>
          )}
        </Section>

        <Section section="medications" defaultOpen={episode.prescriptions.length > 0}>
          {episode.prescriptions.length > 0 && (
            <div className="mb-2 space-y-1">
              {episode.prescriptions.map((rx) => (
                <p key={rx.id} className="text-sm">
                  <span className="font-medium text-clinic-steel">
                    {rx.medication.brandName}
                    {rx.medication.strength ? ` ${rx.medication.strength}` : ''}
                  </span>{' '}
                  <span className="text-slate-600">
                    {[rx.dose, rx.frequency, rx.indication].filter(Boolean).join(' · ')} —{' '}
                    {formatDate(rx.prescriptionDate)}
                  </span>
                </p>
              ))}
            </div>
          )}
          {addingRx ? (
            <PrescribeForm
              episodeId={episode.id}
              onSaved={() => {
                setAddingRx(false);
                onReload();
              }}
            />
          ) : (
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddingRx(true)}>
                + Prescribe · وصف دواء
              </Button>
            </div>
          )}
        </Section>

        {isObs && (
          <Section section="delivery" defaultOpen={!!p?.deliveryDate}>
            {editingDelivery ? (
              <DeliveryForm
                key={p?.deliveryDate ?? 'new'}
                episodeId={episode.id}
                pregnancy={p}
                onSaved={() => {
                  setEditingDelivery(false);
                  onReload();
                }}
              />
            ) : (
              <>
                <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  <Field label="Date of delivery" value={formatDate(p?.deliveryDate)} />
                  <Field label="Hospital" value={p?.hospital} />
                  <Field label="Mode" value={p?.deliveryMode} />
                  <Field label="Anesthesia" value={p?.anesthesia} />
                  <Field label="Maternal comp." value={p?.maternalComplications} />
                  <Field label="Fetal comp." value={p?.fetalComplications} />
                  <Field label="Fetal sex" value={p?.fetalSex} />
                  <Field label="Postnatal visit" value={formatDate(p?.postnatalDate)} />
                </div>
                <div className="mt-2 flex justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditingDelivery(true)}>
                    Record / update · تسجيل
                  </Button>
                </div>
              </>
            )}
          </Section>
        )}
      </div>
    </Card>
  );
}

export function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { t } = useI18n();
  // The detail GET also returns attachments (createdAt desc) — the shared
  // PatientDetailDto predates them, so widen locally.
  type PatientWithAttachments = PatientDetailDto & { attachments?: AttachmentDto[] };
  const [patient, setPatient] = useState<PatientWithAttachments | null>(null);
  const [error, setError] = useState(false);
  const [addingLab, setAddingLab] = useState(false);
  const [labEpisodeId, setLabEpisodeId] = useState<string>('');
  const [addingObh, setAddingObh] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api.get<PatientWithAttachments>(`patients/${id}`).then(setPatient).catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(load, [load]);

  useEffect(() => {
    if (patient && !labEpisodeId) setLabEpisodeId(patient.episodes[0]?.id ?? '');
  }, [patient, labEpisodeId]);

  if (error)
    return (
      <div className="mx-auto max-w-md space-y-3 p-8 text-center">
        <p className="text-lg font-semibold text-clinic-red">Could not load this patient file</p>
        <p className="text-sm text-slate-500">
          The record may be temporarily unavailable. Try reloading — if it persists, check the dev server.
        </p>
        <Link to="/" className="inline-block text-sm text-clinic-blue hover:underline">
          {t('backToRegistry')}
        </Link>
      </div>
    );
  if (!patient) return <p className="p-6 text-slate-400">{t('loading')}</p>;

  const age = ageFromDob(patient.dateOfBirth);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-clinic-blue hover:underline">
          {t('backToRegistry')}
        </Link>
        <Link to={`/patients/${patient.id}/print`} className="text-sm text-clinic-blue hover:underline">
          Print file · طباعة الملف
        </Link>
      </div>

      {/* Demographics strip — mirrors the paper header */}
      <Card className="overflow-hidden">
        <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-white">
          <span className="text-sm font-semibold">Patient Data · بيانات المريضة</span>
        </div>
        <div className="grid gap-x-8 gap-y-1 p-4 sm:grid-cols-3">
          <Field label="Name · الاسم" value={patient.identity?.fullName} />
          <Field label="Code" value={patient.patientCode} />
          <Field label="Age · السن" value={age != null ? `${age} ${t('ageYears')}` : '—'} />
          <Field label={`${t('mobile')} · المحمول`} value={patient.identity?.mobile} />
          <Field label={`${t('husband')} · اسم الزوج`} value={patient.identity?.husbandName} />
          <Field
            label="Blood group"
            value={patient.bloodGroup ? `${patient.bloodGroup} ${patient.rhType ?? ''}`.trim() : '—'}
          />
        </div>
      </Card>

      <Section section="obstetricHistory" defaultOpen={patient.obstetricHistory.length > 0}>
        {patient.obstetricHistory.length > 0 && (
          <table className="mb-2 w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-line text-left text-clinic-steel">
                <th className="py-1 pe-2">Year</th>
                <th className="py-1 pe-2">Duration</th>
                <th className="py-1 pe-2">Pregnancy</th>
                <th className="py-1 pe-2">Comp</th>
                <th className="py-1 pe-2">Mode</th>
                <th className="py-1">Post-partum</th>
              </tr>
            </thead>
            <tbody>
              {patient.obstetricHistory.map((r) => (
                <tr key={r.id} className="border-b border-clinic-line/60 last:border-0">
                  <td className="py-1.5 pe-2">{r.year ?? '—'}</td>
                  <td className="py-1.5 pe-2">{r.duration ?? '—'}</td>
                  <td className="py-1.5 pe-2">{r.pregnancyNote ?? '—'}</td>
                  <td className="py-1.5 pe-2">{r.complications ?? '—'}</td>
                  <td className="py-1.5 pe-2">{r.deliveryMode ?? '—'}</td>
                  <td className="py-1.5">{r.postPartum ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {addingObh ? (
          <AddObstetricRowForm
            patientId={patient.id}
            onSaved={() => {
              setAddingObh(false);
              load();
            }}
          />
        ) : (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAddingObh(true)}>
              + Row · إضافة سطر
            </Button>
          </div>
        )}
      </Section>

      {patient.episodes.map((ep) => (
        <EpisodeCard key={ep.id} episode={ep} onReload={load} />
      ))}

      <Section section="labs" defaultOpen>
        {patient.labReports.length > 0 && (
          <div className="mb-3 space-y-3">
            {patient.labReports.map((r) => (
              <div key={r.id} className="text-sm">
                <p className="font-medium text-clinic-steel">
                  {formatDate(r.reportDate)} · {r.laboratoryName ?? '—'}
                </p>
                <p className="text-slate-600">
                  {r.results
                    .map((x) => {
                      const val = x.resultValue != null ? x.resultValue : '—';
                      const flag = x.abnormalFlag === 'low' ? ' ↓' : x.abnormalFlag === 'high' ? ' ↑' : '';
                      return `${x.testName}: ${val} ${x.unit ?? ''}${flag}`;
                    })
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
        {addingLab ? (
          <div>
            {patient.episodes.length > 1 && (
              <select
                value={labEpisodeId}
                onChange={(e) => setLabEpisodeId(e.target.value)}
                className="mb-2 h-9 rounded-md border border-clinic-line bg-white px-2 text-sm"
              >
                {patient.episodes.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {MODULE_LABELS[ep.type]?.[0] ?? ep.type}
                  </option>
                ))}
              </select>
            )}
            <AddLabReportForm
              episodeId={labEpisodeId}
              onSaved={() => {
                setAddingLab(false);
                load();
              }}
            />
          </div>
        ) : (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setAddingLab(true)} disabled={!labEpisodeId}>
              + {t('addLabReport')}
            </Button>
          </div>
        )}
      </Section>

      <AttachmentsSection
        patientId={patient.id}
        attachments={patient.attachments ?? []}
        episodes={patient.episodes.map((ep) => ({ id: ep.id, type: ep.type, status: ep.status }))}
        onReload={load}
      />
    </div>
  );
}
