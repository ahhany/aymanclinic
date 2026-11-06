import { useEffect, useState } from 'react';
import { useApi } from '../db/apiClient';
import { useI18n } from '../i18n';
import type { Language, MessageKey } from '../i18n/messages';
import { formatDate } from '../lib/dates';
import { Card } from '../components/ui/card';
import { StatCard } from '../components/dashboards/StatCard';
import { ChartCard } from '../components/dashboards/ChartCard';
import { BarChart } from '../components/dashboards/BarChart';
import { DonutChart } from '../components/dashboards/DonutChart';
import type { DonutDatum } from '../components/dashboards/DonutChart';
import { HBarList } from '../components/dashboards/HBarList';
import type {
  AdminDashboardDto,
  ClinicalDashboardDto,
  PrescribingDashboardDto,
} from '../components/dashboards/types';

// Clinic palette (D19) plus muted complements for chart segments.
const COLORS = {
  navy: '#17365d',
  blue: '#1f497d',
  steel: '#244061',
  red: '#c00000',
  sky: '#7aa5d2',
  green: '#2f6f4f',
  amber: '#c05621',
  grey: '#94a3b8',
};

type TabKey = 'admin' | 'clinical' | 'prescribing';

const TAB_LABEL: Record<TabKey, MessageKey> = {
  admin: 'tabClinicToday',
  clinical: 'tabClinicalPicture',
  prescribing: 'tabPrescribing',
};

const STATUS_META: Array<{ key: string; labelKey: MessageKey; color: string }> = [
  { key: 'scheduled', labelKey: 'statusScheduled', color: COLORS.sky },
  { key: 'arrived', labelKey: 'statusArrived', color: COLORS.blue },
  { key: 'seen', labelKey: 'statusSeen', color: COLORS.green },
  { key: 'no_show', labelKey: 'statusNoShow', color: COLORS.red },
  { key: 'cancelled', labelKey: 'statusCancelled', color: COLORS.grey },
];

const GA_META: Array<{ key: 'lt13' | 'w13_27' | 'w28_36' | 'w37plus'; labelKey: MessageKey; color: string }> = [
  { key: 'lt13', labelKey: 'db2GaLt13', color: COLORS.sky },
  { key: 'w13_27', labelKey: 'db2Ga1327', color: COLORS.blue },
  { key: 'w28_36', labelKey: 'db2Ga2836', color: COLORS.steel },
  { key: 'w37plus', labelKey: 'db2Ga37plus', color: COLORS.red },
];

const ANEMIA_META: Array<{ key: 'severe' | 'moderate' | 'mild' | 'normal'; labelKey: MessageKey; color: string }> = [
  { key: 'severe', labelKey: 'db2Severe', color: COLORS.red },
  { key: 'moderate', labelKey: 'db2Moderate', color: COLORS.amber },
  { key: 'mild', labelKey: 'db2Mild', color: COLORS.blue },
  { key: 'normal', labelKey: 'db2Normal', color: COLORS.green },
];

const DELIVERY_MODE_LABEL: Record<string, MessageKey> = {
  vaginal: 'db2Vaginal',
  CS: 'db2CS',
  other: 'db2OtherMode',
};

type T = (key: MessageKey) => string;

function weekdayLabel(dateKey: string, lang: Language): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short' }).format(
    new Date(y, m - 1, d),
  );
}

function monthLabel(key: string, lang: Language): string {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { month: 'short' }).format(new Date(y, m - 1, 1));
}

function EmptyNote({ text }: { text: string }) {
  return <p className="py-4 text-center text-sm text-slate-400">{text}</p>;
}

// --- DB1 — Clinic Today ---

function AdminTab({ data, t, lang }: { data: AdminDashboardDto; t: T; lang: Language }) {
  const newThisMonth = data.newPatientsPerMonth[data.newPatientsPerMonth.length - 1]?.count ?? 0;
  const statusDonut: DonutDatum[] = STATUS_META.map((s) => ({
    label: t(s.labelKey),
    value: data.today.byStatus[s.key] ?? 0,
    color: s.color,
  }));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t('db1AppointmentsToday')} value={data.today.total} />
        <StatCard label={t('statusArrived')} value={data.today.byStatus.arrived ?? 0} />
        <StatCard label={t('statusSeen')} value={data.today.byStatus.seen ?? 0} />
        <StatCard label={t('db1NoShows')} value={data.today.byStatus.no_show ?? 0} accent />
        <StatCard label={t('db1NewThisMonth')} value={newThisMonth} />
        <StatCard label={t('db1Overdue')} value={data.overdueFollowUps.count} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('db1WeekVolume')}>
          <BarChart data={data.week.map((d) => ({ label: weekdayLabel(d.date, lang), value: d.count }))} />
        </ChartCard>
        <ChartCard title={t('db1AppointmentsToday')}>
          <DonutChart data={statusDonut} centerText={data.today.total} />
        </ChartCard>
        <ChartCard title={t('db1NewPatients')}>
          <BarChart
            data={data.newPatientsPerMonth.map((d) => ({ label: monthLabel(d.month, lang), value: d.count }))}
          />
        </ChartCard>
        <ChartCard title={t('db1PerLocation')}>
          <HBarList
            data={data.appointmentsPerLocation.map((d) => ({ label: d.location ?? '—', value: d.count }))}
            emptyText={t('dashNoData')}
          />
        </ChartCard>
      </div>

      <Card>
        <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-sm font-semibold text-white">
          {t('db1Overdue')}
        </div>
        {data.overdueFollowUps.rows.length === 0 ? (
          <EmptyNote text={t('db1NoOverdue')} />
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-line text-start text-clinic-steel">
                <th className="px-4 py-1.5 text-start">{t('colCode')}</th>
                <th className="px-4 py-1.5 text-start">{t('colName')}</th>
                <th className="px-4 py-1.5 text-start">{t('fileType')}</th>
                <th className="px-4 py-1.5 text-start">{t('db1PlannedVisit')}</th>
                <th className="px-4 py-1.5 text-start">{t('daysOverdue')}</th>
              </tr>
            </thead>
            <tbody>
              {data.overdueFollowUps.rows.map((r) => (
                <tr key={`${r.patientId}-${r.nextVisitDate}`} className="border-b border-clinic-line/60 last:border-0">
                  <td className="px-4 py-1.5">{r.patientCode}</td>
                  <td className="px-4 py-1.5">{r.fullName}</td>
                  <td className="px-4 py-1.5 text-slate-500">{r.episodeType}</td>
                  <td className="px-4 py-1.5">{formatDate(r.nextVisitDate)}</td>
                  <td className="px-4 py-1.5 font-semibold text-clinic-red">{r.daysOverdue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// --- DB2 — Clinical Picture ---

function ClinicalTab({ data, t }: { data: ClinicalDashboardDto; t: T }) {
  const bucketCount = (key: string) => data.pregnancies.buckets.find((b) => b.key === key)?.count ?? 0;
  const gaDonut: DonutDatum[] = GA_META.map((g) => ({ label: t(g.labelKey), value: bucketCount(g.key), color: g.color }));
  const anemiaDonut: DonutDatum[] = ANEMIA_META.map((a) => ({
    label: t(a.labelKey),
    value: data.anemia[a.key],
    color: a.color,
  }));
  const modeColors: Record<string, string> = { vaginal: COLORS.blue, CS: COLORS.red, other: COLORS.grey };
  const deliveryDonut: DonutDatum[] = data.deliveryModes.map((d) => ({
    label: t(DELIVERY_MODE_LABEL[d.mode] ?? 'db2OtherMode'),
    value: d.count,
    color: modeColors[d.mode] ?? COLORS.grey,
  }));
  const anemic = data.anemia.severe + data.anemia.moderate + data.anemia.mild;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('db2ActivePregnancies')} value={data.pregnancies.total} />
        <StatCard label={t('db2ApproachingTerm')} value={bucketCount('w37plus')} />
        <StatCard label={t('db2AnemicCount')} value={anemic} accent />
        <StatCard label={t('db2BpWatch')} value={data.bpFlags.count} accent />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('db2GaBuckets')}>
          {data.pregnancies.total === 0 ? (
            <EmptyNote text={t('dashNoData')} />
          ) : (
            <DonutChart data={gaDonut} centerText={data.pregnancies.total} />
          )}
          {data.pregnancies.unknown > 0 && (
            <p className="mt-2 text-xs text-slate-400">
              {t('db2GaUnknown')}: {data.pregnancies.unknown}
            </p>
          )}
        </ChartCard>
        <ChartCard title={t('db2Anemia')}>
          {data.anemia.tested === 0 ? (
            <EmptyNote text={t('dashNoData')} />
          ) : (
            <DonutChart data={anemiaDonut} centerText={data.anemia.tested} />
          )}
        </ChartCard>
        <ChartCard title={t('db2TopDiagnoses')}>
          <HBarList
            data={data.topDiagnoses.map((d) => ({ label: d.label, value: d.count }))}
            emptyText={t('dashNoData')}
          />
        </ChartCard>
        <ChartCard title={t('db2DeliveryMode')}>
          {data.deliveryModes.length === 0 ? (
            <EmptyNote text={t('dashNoData')} />
          ) : (
            <DonutChart data={deliveryDonut} />
          )}
        </ChartCard>
      </div>

      <Card>
        <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-sm font-semibold text-white">
          {t('db2BpWatch')}
        </div>
        {data.bpFlags.rows.length === 0 ? (
          <EmptyNote text={t('db2NoBpFlags')} />
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-line text-clinic-steel">
                <th className="px-4 py-1.5 text-start">{t('colCode')}</th>
                <th className="px-4 py-1.5 text-start">{t('colName')}</th>
                <th className="px-4 py-1.5 text-start">{t('colBp')}</th>
                <th className="px-4 py-1.5 text-start">{t('date')}</th>
              </tr>
            </thead>
            <tbody>
              {data.bpFlags.rows.map((r) => (
                <tr key={r.patientId} className="border-b border-clinic-line/60 last:border-0">
                  <td className="px-4 py-1.5">{r.patientCode}</td>
                  <td className="px-4 py-1.5">{r.fullName}</td>
                  <td className="px-4 py-1.5 font-semibold text-clinic-red">
                    {r.bpSystolic ?? '—'}/{r.bpDiastolic ?? '—'}
                  </td>
                  <td className="px-4 py-1.5 text-slate-500">{formatDate(r.visitDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// --- DB4 — Prescribing ---

function PrescribingTab({ data, t, lang }: { data: PrescribingDashboardDto; t: T; lang: Language }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label={t('db4TotalRx')} value={data.totalPrescriptions} />
        <StatCard label={t('db4LibraryTotal')} value={data.library.total} />
        <StatCard label={t('db4EverPrescribed')} value={`${data.library.percentPrescribed}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t('db4TopMeds')} className="lg:col-span-2">
          <HBarList
            data={data.topMedications.map((m) => ({
              label: `${m.brandName} · ${m.activeIngredient}`,
              value: m.count,
            }))}
            emptyText={t('dashNoData')}
          />
        </ChartCard>
        <ChartCard title={t('db4PerMonth')}>
          <BarChart
            data={data.prescriptionsPerMonth.map((d) => ({ label: monthLabel(d.month, lang), value: d.count }))}
          />
        </ChartCard>
        <ChartCard title={t('db4TopIndications')}>
          <HBarList
            data={data.topIndications.map((d) => ({ label: d.text, value: d.count }))}
            emptyText={t('dashNoData')}
          />
        </ChartCard>
      </div>
    </div>
  );
}

/** /dashboards — DB1 (Clinic Today) + DB2 (Clinical Picture) + DB4 (Prescribing), Phase 2 (D22). */
export function DashboardsPage() {
  const api = useApi();
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<TabKey>('admin');
  const [admin, setAdmin] = useState<AdminDashboardDto | null>(null);
  const [clinical, setClinical] = useState<ClinicalDashboardDto | null>(null);
  const [prescribing, setPrescribing] = useState<PrescribingDashboardDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    async function load() {
      try {
        if (tab === 'admin' && admin === null) {
          const d = await api.get<AdminDashboardDto>('dashboards/admin');
          if (!cancelled) setAdmin(d);
        } else if (tab === 'clinical' && clinical === null) {
          const d = await api.get<ClinicalDashboardDto>('dashboards/clinical');
          if (!cancelled) setClinical(d);
        } else if (tab === 'prescribing' && prescribing === null) {
          const d = await api.get<PrescribingDashboardDto>('dashboards/prescribing');
          if (!cancelled) setPrescribing(d);
        }
      } catch {
        if (!cancelled) setError(t('dashLoadError'));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // Load once per tab, then serve from state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const tabs: TabKey[] = ['admin', 'clinical', 'prescribing'];
  const current = tab === 'admin' ? admin : tab === 'clinical' ? clinical : prescribing;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-clinic-navy">{t('navDashboards')}</h1>

      <div className="flex gap-1 border-b border-clinic-line">
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-t-md px-4 py-2 text-sm font-medium ${
              tab === key
                ? 'border border-b-0 border-clinic-line bg-white text-clinic-navy'
                : 'text-clinic-steel hover:text-clinic-navy'
            }`}
          >
            {t(TAB_LABEL[key])}
          </button>
        ))}
      </div>

      {error && <p className="py-6 text-center text-sm font-medium text-clinic-red">{error}</p>}
      {!error && current === null && <p className="py-6 text-center text-slate-400">{t('loading')}</p>}
      {!error && admin !== null && tab === 'admin' && <AdminTab data={admin} t={t} lang={lang} />}
      {!error && clinical !== null && tab === 'clinical' && <ClinicalTab data={clinical} t={t} />}
      {!error && prescribing !== null && tab === 'prescribing' && <PrescribingTab data={prescribing} t={t} lang={lang} />}
    </div>
  );
}
