import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../db/apiClient';
import type { EpisodeDto, PatientDetailDto } from '../db/types';
import { useI18n } from '../i18n';
import { MODULE_LABELS } from '../i18n/sections';
import { Section } from '../components/Section';
import { Card } from '../components/ui/card';
import { ageFromDob, formatDate } from '../lib/dates';
import { gestationalAgeAt } from '../lib/clinical/ga';

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="min-w-28 font-medium text-clinic-steel">{label}</span>
      <span>{value ?? '—'}</span>
    </div>
  );
}

function ObsEpisode({ episode }: { episode: EpisodeDto }) {
  const p = episode.pregnancy;
  const gaToday = p?.lmpDate ? gestationalAgeAt(new Date(p.lmpDate), new Date()) : null;
  return (
    <div className="space-y-3">
      <Section section="history" defaultOpen>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field label="LMP" value={formatDate(p?.lmpDate)} />
          <Field label="EDD" value={formatDate(p?.eddDate)} />
          <Field label="G / P / A" value={`${p?.gravida ?? '—'} / ${p?.parity ?? '—'} / ${p?.abortions ?? '—'}`} />
          <Field label="GA today" value={gaToday ? `${gaToday.weeks}+${gaToday.days} wks` : '—'} />
        </div>
      </Section>
      <Section section="visits" defaultOpen>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-clinic-line text-left text-clinic-steel">
              <th className="py-1 pe-2">Date</th>
              <th className="py-1 pe-2">Wt (kg)</th>
              <th className="py-1 pe-2">B/P</th>
              <th className="py-1 pe-2">GA</th>
              <th className="py-1 pe-2">Complaints</th>
              <th className="py-1">Management & next visit</th>
            </tr>
          </thead>
          <tbody>
            {episode.visits.map((v) => {
              const ga = p?.lmpDate ? gestationalAgeAt(new Date(p.lmpDate), new Date(v.visitDate)) : null;
              return (
                <tr key={v.id} className="border-b border-clinic-line/60 last:border-0">
                  <td className="py-1.5 pe-2 whitespace-nowrap">{formatDate(v.visitDate)}</td>
                  <td className="py-1.5 pe-2">{v.weightKg ?? '—'}</td>
                  <td className="py-1.5 pe-2">
                    {v.bpSystolic != null && v.bpDiastolic != null ? `${v.bpSystolic}/${v.bpDiastolic}` : '—'}
                  </td>
                  <td className="py-1.5 pe-2">{ga ? `${ga.weeks}+${ga.days}` : '—'}</td>
                  <td className="py-1.5 pe-2">{v.complaints ?? '—'}</td>
                  <td className="py-1.5">{v.management ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
      <Section section="delivery">
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field label="Date of delivery" value={formatDate(p?.deliveryDate)} />
          <Field label="Mode" value={p?.deliveryMode} />
        </div>
      </Section>
    </div>
  );
}

function GynEpisode({ episode }: { episode: EpisodeDto }) {
  const g = episode.gyn;
  return (
    <div className="space-y-3">
      <Section section="history" defaultOpen>
        <div className="grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <Field label="Married for" value={g?.marriedFor} />
          <Field label="Contraception" value={g?.contraception} />
          <Field label="Menstrual" value={g?.menstrualHistory} />
        </div>
      </Section>
      <Section section="semenAnalysis" defaultOpen={episode.semenAnalyses.length > 0}>
        {episode.semenAnalyses.length === 0 ? (
          <p className="text-sm text-slate-400">—</p>
        ) : (
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
        )}
      </Section>
      <Section section="followUps" defaultOpen>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-clinic-line text-left text-clinic-steel">
              <th className="py-1 pe-2">Date</th>
              <th className="py-1 pe-2">Complaint</th>
              <th className="py-1">Management & next visit</th>
            </tr>
          </thead>
          <tbody>
            {episode.visits.map((v) => (
              <tr key={v.id} className="border-b border-clinic-line/60 last:border-0">
                <td className="py-1.5 pe-2 whitespace-nowrap">{formatDate(v.visitDate)}</td>
                <td className="py-1.5 pe-2">{v.complaints ?? '—'}</td>
                <td className="py-1.5">{v.management ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

export function PatientPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const { t } = useI18n();
  const [patient, setPatient] = useState<PatientDetailDto | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<PatientDetailDto>(`patients/${id}`).then(setPatient).catch(() => setError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) return <p className="p-6 text-clinic-red">—</p>;
  if (!patient) return <p className="p-6 text-slate-400">{t('loading')}</p>;

  const age = ageFromDob(patient.dateOfBirth);

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-clinic-blue hover:underline">
        {t('backToRegistry')}
      </Link>

      {/* Demographics strip — mirrors the paper header */}
      <Card className="overflow-hidden">
        <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-white">
          <span className="text-sm font-semibold">Patient Data · بيانات المريضة</span>
        </div>
        <div className="grid gap-x-8 gap-y-1 p-4 sm:grid-cols-3">
          <Field label="Name · الاسم" value={patient.identity?.fullName} />
          <Field label="Code" value={patient.patientCode} />
          <Field label={`Age · السن`} value={age != null ? `${age} ${t('ageYears')}` : '—'} />
          <Field label={`${t('mobile')} · المحمول`} value={patient.identity?.mobile} />
          <Field label={`${t('husband')} · اسم الزوج`} value={patient.identity?.husbandName} />
          <Field
            label="Blood group"
            value={patient.bloodGroup ? `${patient.bloodGroup} ${patient.rhType ?? ''}`.trim() : '—'}
          />
        </div>
      </Card>

      {patient.episodes.map((ep) => (
        <Card key={ep.id} className="overflow-hidden">
          <div className="flex items-center gap-2 bg-clinic-navy px-4 py-1.5 text-sm font-semibold text-white">
            <span>{MODULE_LABELS[ep.type]?.[0] ?? ep.type}</span>
            <span className="text-white/60">{MODULE_LABELS[ep.type]?.[1]}</span>
            <span className="ms-auto rounded bg-white/15 px-2 py-0.5 text-xs">{ep.status}</span>
          </div>
          <div className="p-3">{ep.type === 'OBS' ? <ObsEpisode episode={ep} /> : <GynEpisode episode={ep} />}</div>
        </Card>
      ))}

      <Section section="labs">
        {patient.labReports.length === 0 ? (
          <p className="text-sm text-slate-400">—</p>
        ) : (
          <div className="space-y-3">
            {patient.labReports.map((r) => (
              <div key={r.id} className="text-sm">
                <p className="font-medium text-clinic-steel">
                  {formatDate(r.reportDate)} · {r.laboratoryName ?? '—'}
                </p>
                <p className="text-slate-600">
                  {r.results
                    .map((x) => `${x.testName}: ${x.resultValue ?? x.resultValue === 0 ? x.resultValue : '—'} ${x.unit ?? ''}`)
                    .join(' · ')}
                </p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
