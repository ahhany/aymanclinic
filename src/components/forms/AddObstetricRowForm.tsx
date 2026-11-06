import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/** Inline row form mirroring the paper obstetric-history grid. */
export function AddObstetricRowForm({ patientId, onSaved }: { patientId: string; onSaved: () => void }) {
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
    const yearStr = str('year');
    const year = yearStr ? Number.parseInt(yearStr, 10) : NaN;
    setBusy(true);
    setError(false);
    try {
      await api.post(`patients/${patientId}/obstetric-history`, {
        year: Number.isFinite(year) ? year : undefined,
        duration: str('duration'),
        pregnancyNote: str('pregnancyNote'),
        complications: str('complications'),
        deliveryMode: str('deliveryMode'),
        postPartum: str('postPartum'),
      });
      onSaved();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
      <div className="grid gap-2 sm:grid-cols-6">
        <Input name="year" type="number" min="0" placeholder="Year · السنة" aria-label="Year" />
        <Input name="duration" placeholder="Duration · المدة" aria-label="Duration" />
        <Input name="pregnancyNote" placeholder="Pregnancy · الحمل" aria-label="Pregnancy" />
        <Input name="complications" placeholder="Complications · المضاعفات" aria-label="Complications" />
        <select
          name="deliveryMode"
          defaultValue=""
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Delivery mode"
        >
          <option value="">Delivery · الولادة</option>
          <option value="vaginal">Vaginal · طبيعية</option>
          <option value="CS">CS · قيصرية</option>
          <option value="other">Other · أخرى</option>
        </select>
        <Input name="postPartum" placeholder="Post-partum · ما بعد الولادة" aria-label="Post-partum" />
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
