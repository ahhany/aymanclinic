import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../db/apiClient';
import { useI18n } from '../i18n';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { Input } from './ui/input';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-clinic-steel">{label}</span>
      {children}
    </label>
  );
}

export function NewPatientDialog({ onClose }: { onClose: () => void }) {
  const api = useApi();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [episodeType, setEpisodeType] = useState<'OBS' | 'GYN'>('OBS');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    const int = (k: string) => {
      const v = str(k);
      return v ? parseInt(v, 10) : undefined;
    };
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<{ id: string; patientCode: string }>('patients', {
        fullName: str('fullName'),
        mobile: str('mobile'),
        husbandName: str('husbandName'),
        dateOfBirth: str('dateOfBirth'),
        bloodGroup: str('bloodGroup'),
        rhType: str('rhType'),
        heightCm: (() => {
          const v = str('heightCm');
          return v ? Number(v) : undefined;
        })(),
        episodeType,
        lmpDate: episodeType === 'OBS' ? str('lmpDate') : undefined,
        gravida: episodeType === 'OBS' ? int('gravida') : undefined,
        parity: episodeType === 'OBS' ? int('parity') : undefined,
        abortions: episodeType === 'OBS' ? int('abortions') : undefined,
        marriedFor: episodeType === 'GYN' ? str('marriedFor') : undefined,
        contraception: episodeType === 'GYN' ? str('contraception') : undefined,
        menstrualHistory: episodeType === 'GYN' ? str('menstrualHistory') : undefined,
      });
      navigate(`/patients/${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('saveError'));
      setBusy(false);
    }
  }

  return (
    <Modal title={`${t('newPatient')} · مريضة جديدة`} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['OBS', 'GYN'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setEpisodeType(m)}
              className={`flex-1 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                episodeType === m
                  ? m === 'OBS'
                    ? 'border-clinic-blue bg-clinic-blue text-white'
                    : 'border-clinic-red bg-clinic-red text-white'
                  : 'border-clinic-line bg-white text-slate-500 hover:bg-slate-50'
              }`}
            >
              {m === 'OBS' ? 'Obstetrics · متابعة حمل' : 'Gynecology · نساء'}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`${t('fullName')} *`}>
            <Input name="fullName" required />
          </Field>
          <Field label={t('mobile')}>
            <Input name="mobile" dir="ltr" />
          </Field>
          <Field label={t('husband')}>
            <Input name="husbandName" />
          </Field>
          <Field label={t('dob')}>
            <Input name="dateOfBirth" type="date" />
          </Field>
          <Field label={t('bloodGroup')}>
            <div className="flex gap-2">
              <select name="bloodGroup" className="h-10 flex-1 rounded-md border border-clinic-line px-2 text-sm">
                <option value="">—</option>
                {['A', 'B', 'AB', 'O'].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              <select name="rhType" className="h-10 w-20 rounded-md border border-clinic-line px-2 text-sm">
                <option value="">—</option>
                <option>+</option>
                <option>−</option>
              </select>
            </div>
          </Field>
          <Field label="Height (cm) · الطول">
            <Input name="heightCm" type="number" min="100" max="220" step="0.5" placeholder="160" />
          </Field>
        </div>

        {episodeType === 'OBS' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('lmp')}>
              <Input name="lmpDate" type="date" />
            </Field>
            <Field label={t('gpa')}>
              <div className="flex gap-2">
                <Input name="gravida" type="number" min="0" placeholder="G" />
                <Input name="parity" type="number" min="0" placeholder="P" />
                <Input name="abortions" type="number" min="0" placeholder="A" />
              </div>
            </Field>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={t('marriedFor')}>
              <Input name="marriedFor" />
            </Field>
            <Field label={t('contraception')}>
              <Input name="contraception" />
            </Field>
            <Field label={t('menstrual')}>
              <Input name="menstrualHistory" />
            </Field>
          </div>
        )}

        {error && <p className="text-sm font-medium text-clinic-red">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={busy}>
            {t('save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
