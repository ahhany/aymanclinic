import { useEffect, useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import type { MedicationDto } from '../../db/types';
import { useI18n } from '../../i18n';
import { groupByIngredient } from '../../lib/medications';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const NEW_MEDICATION = '__new__';
const ROUTES = ['oral', 'IM', 'IV', 'pessary', 'topical', 'other'] as const;

/** Prescriber — pick a brand from the library (grouped by active ingredient)
 *  or enter a new medication inline, then dose/frequency/route/duration. */
export function PrescribeForm({ episodeId, onSaved }: { episodeId: string; onSaved: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const [meds, setMeds] = useState<MedicationDto[]>([]);
  const [selection, setSelection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get<MedicationDto[]>('medications')
      .then(setMeds)
      .catch(() => setMeds([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const durationRaw = str('durationDays');
    const durationParsed = durationRaw ? Number.parseInt(durationRaw, 10) : NaN;
    setBusy(true);
    setError(false);
    try {
      await api.post(`episodes/${episodeId}/prescriptions`, {
        ...(selection === NEW_MEDICATION
          ? {
              newMedication: {
                brandName: str('brandName'),
                activeIngredient: str('activeIngredient'),
                form: str('form'),
                strength: str('strength'),
              },
            }
          : { medicationId: selection }),
        dose: str('dose'),
        frequency: str('frequency'),
        route: str('route'),
        durationDays: Number.isNaN(durationParsed) ? undefined : durationParsed,
        indication: str('indication'),
      });
      onSaved();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={selection}
          onChange={(e) => setSelection(e.target.value)}
          required
          className="h-10 rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Medication"
        >
          <option value="" disabled>
            Medication · الدواء
          </option>
          {groupByIngredient(meds).map(([ingredient, brands]) => (
            <optgroup key={ingredient} label={ingredient}>
              {brands.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brandName}
                  {m.strength ? ` ${m.strength}` : ''}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={NEW_MEDICATION}>New medication… · دواء جديد…</option>
        </select>
        <Input name="dose" placeholder="Dose · الجرعة" aria-label="Dose" />
        <Input name="frequency" placeholder="Frequency · التكرار" aria-label="Frequency" />
      </div>
      {selection === NEW_MEDICATION && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input name="brandName" required placeholder="Brand name · الاسم التجاري" aria-label="Brand name" />
          <Input
            name="activeIngredient"
            required
            placeholder="Active ingredient · المادة الفعالة"
            aria-label="Active ingredient"
          />
          <Input name="form" placeholder="Form · الشكل الصيدلاني" aria-label="Form" />
          <Input name="strength" placeholder="Strength · التركيز" aria-label="Strength" />
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="route"
          defaultValue="oral"
          className="h-10 rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Route"
        >
          {ROUTES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Input
          name="durationDays"
          type="number"
          min="0"
          placeholder="Duration (days) · المدة (أيام)"
          aria-label="Duration (days)"
        />
        <Input name="indication" placeholder="Indication · الاستطباب" aria-label="Indication" />
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
