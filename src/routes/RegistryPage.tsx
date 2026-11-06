import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../db/apiClient';
import type { RegistryPatient } from '../db/types';
import { useI18n } from '../i18n';
import { MODULE_LABELS } from '../i18n/sections';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';

const MODULE_CHIP: Record<string, string> = {
  OBS: 'bg-clinic-blue text-white',
  GYN: 'bg-clinic-red text-white',
  ICSI: 'bg-clinic-steel text-white',
};

export function RegistryPage() {
  const api = useApi();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<RegistryPatient[] | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .get<RegistryPatient[]>(`patients${search ? `?search=${encodeURIComponent(search)}` : ''}`)
        .then(setPatients)
        .catch(() => setPatients([]));
    }, 200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="max-w-lg"
        autoFocus
      />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b-2 border-clinic-red bg-clinic-blue text-left text-white">
              <th className="px-3 py-2 font-semibold">{t('colCode')}</th>
              <th className="px-3 py-2 font-semibold">{t('colName')}</th>
              <th className="px-3 py-2 font-semibold">{t('colMobile')}</th>
              <th className="px-3 py-2 font-semibold">{t('colModules')}</th>
            </tr>
          </thead>
          <tbody>
            {patients === null && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  {t('loading')}
                </td>
              </tr>
            )}
            {patients?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  {t('noPatients')}
                </td>
              </tr>
            )}
            {patients?.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="cursor-pointer border-b border-clinic-line last:border-0 hover:bg-clinic-blue/5"
                title={t('openFile')}
              >
                <td className="px-3 py-2.5 font-mono text-clinic-blue">{p.patientCode}</td>
                <td className="px-3 py-2.5 font-medium">{p.fullName}</td>
                <td className="px-3 py-2.5 text-slate-500" dir="ltr">
                  {p.mobile ?? '—'}
                </td>
                <td className="px-3 py-2.5">
                  <span className="flex gap-1.5">
                    {p.modules.map((m) => (
                      <span
                        key={m}
                        className={cn('rounded px-2 py-0.5 text-xs font-semibold', MODULE_CHIP[m] ?? 'bg-slate-200')}
                        title={MODULE_LABELS[m]?.[0] ?? m}
                      >
                        {m}
                      </span>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
