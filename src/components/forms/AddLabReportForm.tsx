import { useEffect, useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import type { TestDefinitionDto } from '../../db/types';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const todayIso = () => new Date().toISOString().slice(0, 10);

interface Row {
  testCode: string;
  value: string;
}

/** Manual lab entry — results are validated against the test dictionary
 *  server-side; names, units, reference ranges and flags are automatic (D8). */
export function AddLabReportForm({ episodeId, onSaved }: { episodeId: string; onSaved: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const [defs, setDefs] = useState<TestDefinitionDto[]>([]);
  const [rows, setRows] = useState<Row[]>([{ testCode: 'CBC_HB', value: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get<TestDefinitionDto[]>('test-definitions').then(setDefs).catch(() => setDefs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setRow(i: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const results = rows
      .filter((r) => r.testCode && r.value.trim())
      .map((r) => ({ testCode: r.testCode, value: Number(r.value) }));
    if (results.length === 0) {
      setError(t('saveError'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.post(`episodes/${episodeId}/lab-reports`, {
        reportDate: f.get('reportDate'),
        laboratoryName: f.get('laboratoryName') || undefined,
        results,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
      setBusy(false);
    }
  }

  const unit = (code: string) => defs.find((d) => d.testCode === code)?.defaultUnit ?? '';

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md border border-clinic-line bg-clinic-paper p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input name="reportDate" type="date" defaultValue={todayIso()} required aria-label={t('date')} />
        <Input name="laboratoryName" placeholder={`${t('labName')} · المعمل`} aria-label={t('labName')} />
      </div>
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2">
          <select
            value={row.testCode}
            onChange={(e) => setRow(i, { testCode: e.target.value })}
            className="h-10 flex-1 rounded-md border border-clinic-line bg-white px-2 text-sm"
            aria-label={t('test')}
          >
            {defs.map((d) => (
              <option key={d.testCode} value={d.testCode}>
                {d.testName}
              </option>
            ))}
          </select>
          <Input
            type="number"
            step="any"
            value={row.value}
            onChange={(e) => setRow(i, { value: e.target.value })}
            placeholder={t('value')}
            className="w-32"
            aria-label={t('value')}
          />
          <span className="w-16 self-center text-xs text-slate-500">{unit(row.testCode)}</span>
          {rows.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
              ✕
            </Button>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRows((rs) => [...rs, { testCode: 'CBC_HB', value: '' }])}
        >
          + {t('test')}
        </Button>
        {error && <p className="text-xs font-medium text-clinic-red">{error}</p>}
        <Button type="submit" size="sm" disabled={busy}>
          {t('save')}
        </Button>
      </div>
    </form>
  );
}
