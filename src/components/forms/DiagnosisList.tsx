import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { DiagnosisDto } from '../../db/types';

/** Diagnosis chips + inline add (G3/D21). Risk factors (E6/D26) get their own
 *  colour and a suggestion list — they feed the high-risk board. */
const RISK_FACTOR_SUGGESTIONS = [
  'Chronic hypertension',
  'Pre-eclampsia history',
  'GDM history',
  'Previous preterm birth',
  'Previous CS',
  'Recurrent miscarriage',
  'Thrombophilia',
  'Multiple gestation',
  'Diabetes mellitus',
  'Thyroid disorder',
];

export function DiagnosisList({ episodeId, diagnoses, onSaved }: { episodeId: string; diagnoses: DiagnosisDto[]; onSaved: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<'general' | 'risk_factor'>('general');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      await api.post(`episodes/${episodeId}/diagnoses`, { label: label.trim(), category });
      setLabel('');
      setCategory('general');
      setAdding(false);
      onSaved();
    } catch {
      /* keep input for retry */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {diagnoses.map((d) =>
        d.category === 'risk_factor' ? (
          <span
            key={d.id}
            title="Risk factor · عامل خطورة"
            className="rounded border border-amber-500/50 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
          >
            ⚠ {d.label}
          </span>
        ) : (
          <span key={d.id} className="rounded bg-clinic-red/10 px-2 py-0.5 text-xs font-medium text-clinic-red">
            {d.label}
          </span>
        ),
      )}
      {adding ? (
        <form onSubmit={onSubmit} className="flex gap-1">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as 'general' | 'risk_factor')}
            className="h-7 rounded-md border border-clinic-line bg-white px-1 text-xs"
            aria-label="Diagnosis category"
          >
            <option value="general">Diagnosis · تشخيص</option>
            <option value="risk_factor">Risk factor · عامل خطورة</option>
          </select>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('addDiagnosis')}
            className="h-7 w-44 text-xs"
            list={category === 'risk_factor' ? 'risk-factor-suggestions' : undefined}
            autoFocus
          />
          {category === 'risk_factor' && (
            <datalist id="risk-factor-suggestions">
              {RISK_FACTOR_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          )}
          <Button type="submit" size="sm" className="h-7">
            {t('save')}
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded border border-dashed border-clinic-line px-2 py-0.5 text-xs text-slate-400 hover:border-clinic-blue hover:text-clinic-blue"
        >
          + {t('addDiagnosis')}
        </button>
      )}
    </div>
  );
}
