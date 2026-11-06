import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { DiagnosisDto } from '../../db/types';

/** Diagnosis chips + inline add (G3/D21). */
export function DiagnosisList({ episodeId, diagnoses, onSaved }: { episodeId: string; diagnoses: DiagnosisDto[]; onSaved: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    try {
      await api.post(`episodes/${episodeId}/diagnoses`, { label: label.trim() });
      setLabel('');
      setAdding(false);
      onSaved();
    } catch {
      /* keep input for retry */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {diagnoses.map((d) => (
        <span key={d.id} className="rounded bg-clinic-red/10 px-2 py-0.5 text-xs font-medium text-clinic-red">
          {d.label}
        </span>
      ))}
      {adding ? (
        <form onSubmit={onSubmit} className="flex gap-1">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('addDiagnosis')}
            className="h-7 w-44 text-xs"
            autoFocus
          />
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
