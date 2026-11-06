import { useEffect, useState } from 'react';
import { useApi } from '../db/apiClient';
import type { TestDefinitionDto } from '../db/types';
import { useI18n } from '../i18n';
import { Card } from '../components/ui/card';

export function SettingsPage() {
  const api = useApi();
  const { t } = useI18n();
  const [defs, setDefs] = useState<TestDefinitionDto[] | null>(null);

  useEffect(() => {
    api.get<TestDefinitionDto[]>('test-definitions').then(setDefs).catch(() => setDefs([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-clinic-navy">{t('settingsTitle')}</h1>
      <Card>
        <div className="border-b-2 border-clinic-red bg-clinic-blue px-4 py-2 text-sm font-semibold text-white">
          {t('testDictionary')}
        </div>
        <p className="px-4 pt-3 text-xs text-slate-500">{t('testDictionaryNote')}</p>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-clinic-line text-left text-clinic-steel">
              <th className="px-4 py-1.5">Code</th>
              <th className="px-4 py-1.5">Test</th>
              <th className="px-4 py-1.5">Unit</th>
              <th className="px-4 py-1.5">Reference</th>
              <th className="px-4 py-1.5">Panel</th>
            </tr>
          </thead>
          <tbody>
            {defs?.map((d) => (
              <tr key={d.testCode} className="border-b border-clinic-line/60 last:border-0">
                <td className="px-4 py-1.5 font-mono text-xs">{d.testCode}</td>
                <td className="px-4 py-1.5">{d.testName}</td>
                <td className="px-4 py-1.5">{d.defaultUnit ?? '—'}</td>
                <td className="px-4 py-1.5">
                  {d.refLow != null && d.refHigh != null ? `${d.refLow} – ${d.refHigh}` : '—'}
                </td>
                <td className="px-4 py-1.5 text-slate-500">{d.panel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
