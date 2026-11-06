import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import { useI18n } from '../../i18n';
import {
  ULTRASOUND_FIELDS,
  ULTRASOUND_TYPES_BY_MODULE,
  ULTRASOUND_TYPE_LABELS,
  type UltrasoundType,
} from '../../lib/ultrasound';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const todayIso = () => new Date().toISOString().slice(0, 10);

/** Milestone ultrasound entry — the dynamic field set comes from the shared
 *  dictionary in lib/ultrasound and is validated server-side (D8). */
export function AddUltrasoundForm({
  episodeId,
  module,
  onSaved,
}: {
  episodeId: string;
  module: string;
  onSaved: () => void;
}) {
  const api = useApi();
  const { t } = useI18n();
  const types = ULTRASOUND_TYPES_BY_MODULE[module] ?? ['followup'];
  const [type, setType] = useState<UltrasoundType>(types[0] ?? 'followup');
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  function onTypeChange(e: ChangeEvent<HTMLSelectElement>) {
    setType(e.target.value as UltrasoundType);
    setValues({});
  }

  function setValue(key: string, value: string | boolean) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const cleanValues: Record<string, string | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === 'boolean') cleanValues[k] = v;
      else if (v.trim()) cleanValues[k] = v.trim();
    }
    setBusy(true);
    setError(false);
    try {
      await api.post(`episodes/${episodeId}/ultrasounds`, {
        type,
        scanDate: str('scanDate'),
        operator: str('operator'),
        place: str('place'),
        values: cleanValues,
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
        <select
          value={type}
          onChange={onTypeChange}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Ultrasound type"
        >
          {types.map((ty) => (
            <option key={ty} value={ty}>
              {ULTRASOUND_TYPE_LABELS[ty]}
            </option>
          ))}
        </select>
        <Input name="scanDate" type="date" defaultValue={todayIso()} required aria-label={t('date')} />
        <Input name="operator" placeholder="Operator · الطبيب" aria-label="Operator" />
        <Input name="place" placeholder="Place · المكان" aria-label="Place" />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {ULTRASOUND_FIELDS[type].map((field) => {
          if (field.kind === 'bool') {
            return (
              <label key={field.key} className="flex h-10 items-center gap-2 text-sm text-clinic-steel">
                <input
                  type="checkbox"
                  checked={values[field.key] === true}
                  onChange={(e) => setValue(field.key, e.target.checked)}
                  className="h-4 w-4"
                />
                {field.label}
              </label>
            );
          }
          return (
            <Input
              key={field.key}
              type={field.kind === 'text' ? 'text' : field.kind}
              step={field.kind === 'number' ? 'any' : undefined}
              value={typeof values[field.key] === 'string' ? (values[field.key] as string) : ''}
              onChange={(e) => setValue(field.key, e.target.value)}
              placeholder={field.label}
              aria-label={field.label}
            />
          );
        })}
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
