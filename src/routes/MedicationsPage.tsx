import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, useApi } from '../db/apiClient';
import type { MedicationDto } from '../db/types';
import { useI18n } from '../i18n';
import { groupByIngredient } from '../lib/medications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

/** Dr. Ayman's personal medication library — brands grouped by active ingredient (D8-adjacent). */
export function MedicationsPage() {
  const api = useApi();
  const { t } = useI18n();
  const [meds, setMeds] = useState<MedicationDto[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    api
      .get<MedicationDto[]>('medications')
      .then(setMeds)
      .catch(() => setMeds([]));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    setBusy(true);
    setError(null);
    try {
      await api.post('medications', {
        brandName: str('brandName'),
        activeIngredient: str('activeIngredient'),
        form: str('form'),
        strength: str('strength'),
      });
      form.reset();
      setBusy(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError && err.status === 409 ? 'medication_exists' : t('saveError'));
      setBusy(false);
    }
  }

  const groups = meds ? groupByIngredient(meds) : [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-clinic-navy">{t('medicationLibrary')}</h1>
      <form onSubmit={onSubmit} className="space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
        <div className="grid gap-2 sm:grid-cols-4">
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
        {error && <p className="text-xs font-medium text-clinic-red">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={busy}>
            {t('addMedication')}
          </Button>
        </div>
      </form>
      {meds === null && <p className="py-6 text-center text-slate-400">{t('loading')}</p>}
      {meds?.length === 0 && <p className="py-6 text-center text-slate-400">{t('noMedications')}</p>}
      {groups.map(([ingredient, brands]) => (
        <Card key={ingredient}>
          <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-sm font-semibold text-white">
            {ingredient}
          </div>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-clinic-line text-left text-clinic-steel">
                <th className="px-4 py-1.5">Brand</th>
                <th className="px-4 py-1.5">Form</th>
                <th className="px-4 py-1.5">Strength</th>
                <th className="px-4 py-1.5">{t('timesPrescribed')}</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((m) => (
                <tr key={m.id} className="border-b border-clinic-line/60 last:border-0">
                  <td className="px-4 py-1.5">{m.brandName}</td>
                  <td className="px-4 py-1.5">{m.form ?? '—'}</td>
                  <td className="px-4 py-1.5">{m.strength ?? '—'}</td>
                  <td className="px-4 py-1.5 text-slate-500">{m.prescriptionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}
