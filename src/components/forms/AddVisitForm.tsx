import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Inline row form mirroring the paper visit grid (D2). */
export function AddVisitForm({ episodeId, onSaved }: { episodeId: string; onSaved: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const num = (k: string) => {
      const v = str(k);
      return v ? Number(v) : undefined;
    };
    setBusy(true);
    setError(false);
    try {
      await api.post(`episodes/${episodeId}/visits`, {
        visitDate: str('visitDate'),
        weightKg: num('weightKg'),
        bpSystolic: num('bpSystolic'),
        bpDiastolic: num('bpDiastolic'),
        ultrasoundNote: str('ultrasoundNote'),
        complaints: str('complaints'),
        management: str('management'),
        nextVisitDate: str('nextVisitDate'),
      });
      onSaved();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
      <div className="grid gap-2 sm:grid-cols-4">
        <Input name="visitDate" type="date" defaultValue={todayIso()} required aria-label={t('date')} />
        <Input name="weightKg" type="number" step="0.1" min="0" placeholder="Wt (kg)" aria-label="Wt (kg)" />
        <Input name="bpSystolic" type="number" min="0" placeholder="BP sys" aria-label="BP systolic" />
        <Input name="bpDiastolic" type="number" min="0" placeholder="BP dia" aria-label="BP diastolic" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="ultrasoundNote" placeholder="U/S" aria-label="U/S" />
        <Input name="complaints" placeholder="Complaints · الشكوى" aria-label="Complaints" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="management" placeholder="Management · العلاج" aria-label="Management" />
        <Input name="nextVisitDate" type="date" aria-label="Next visit date" title="Next visit date" />
      </div>
      {error && <p className="text-xs font-medium text-clinic-red">{t('saveError')}</p>}
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={busy}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
