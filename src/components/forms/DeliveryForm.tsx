import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import type { EpisodeDto } from '../../db/types';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/** Delivery & post-natal visit block — edits the pregnancy sub-object of an
 *  OBS episode. Prefilled from the current values; empty strings are omitted. */
export function DeliveryForm({
  episodeId,
  pregnancy,
  onSaved,
}: {
  episodeId: string;
  pregnancy: EpisodeDto['pregnancy'];
  onSaved: () => void;
}) {
  const api = useApi();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const date = (v: string | null | undefined) => v?.slice(0, 10) ?? '';

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const str = (k: string) => {
      const v = f.get(k);
      return typeof v === 'string' && v.trim() ? v.trim() : undefined;
    };
    setBusy(true);
    setError(false);
    try {
      await api.put(`episodes/${episodeId}/pregnancy`, {
        deliveryDate: str('deliveryDate'),
        hospital: str('hospital'),
        deliveryMode: str('deliveryMode'),
        anesthesia: str('anesthesia'),
        maternalComplications: str('maternalComplications'),
        fetalComplications: str('fetalComplications'),
        fetalSex: str('fetalSex'),
        postnatalDate: str('postnatalDate'),
        postnatalPayment: str('postnatalPayment'),
        postnatalScar: str('postnatalScar'),
        postnatalComplications: str('postnatalComplications'),
        postnatalFollowupTtt: str('postnatalFollowupTtt'),
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
        <Input
          name="deliveryDate"
          type="date"
          defaultValue={date(pregnancy?.deliveryDate)}
          aria-label="Delivery date"
          title="Delivery date"
        />
        <Input
          name="hospital"
          defaultValue={pregnancy?.hospital ?? ''}
          placeholder="Hospital · المستشفى"
          aria-label="Hospital"
        />
        <select
          name="deliveryMode"
          defaultValue={pregnancy?.deliveryMode ?? ''}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Delivery mode"
        >
          <option value="">Delivery · الولادة</option>
          <option value="vaginal">Vaginal · طبيعية</option>
          <option value="CS">CS · قيصرية</option>
          <option value="other">Other · أخرى</option>
        </select>
        <Input
          name="anesthesia"
          defaultValue={pregnancy?.anesthesia ?? ''}
          placeholder="Anesthesia · التخدير"
          aria-label="Anesthesia"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          name="maternalComplications"
          defaultValue={pregnancy?.maternalComplications ?? ''}
          placeholder="Maternal complications · مضاعفات الأم"
          aria-label="Maternal complications"
        />
        <Input
          name="fetalComplications"
          defaultValue={pregnancy?.fetalComplications ?? ''}
          placeholder="Fetal complications · مضاعفات الجنين"
          aria-label="Fetal complications"
        />
        <select
          name="fetalSex"
          defaultValue={pregnancy?.fetalSex ?? ''}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Fetal sex"
        >
          <option value="">Fetal sex · جنس الجنين</option>
          <option value="male">Male · ذكر</option>
          <option value="female">Female · أنثى</option>
        </select>
      </div>
      <h4 className="pt-1 text-xs font-semibold uppercase tracking-wide text-clinic-steel">
        Post natal visit · زيارة ما بعد الولادة
      </h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          name="postnatalDate"
          type="date"
          defaultValue={date(pregnancy?.postnatalDate)}
          aria-label="Postnatal visit date"
          title="Postnatal visit date"
        />
        <Input
          name="postnatalPayment"
          defaultValue={pregnancy?.postnatalPayment ?? ''}
          placeholder="Payment · الدفع"
          aria-label="Postnatal payment"
        />
        <Input
          name="postnatalScar"
          defaultValue={pregnancy?.postnatalScar ?? ''}
          placeholder="Scar · الجرح"
          aria-label="Postnatal scar"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          name="postnatalComplications"
          defaultValue={pregnancy?.postnatalComplications ?? ''}
          placeholder="Complications · المضاعفات"
          aria-label="Postnatal complications"
        />
        <Input
          name="postnatalFollowupTtt"
          defaultValue={pregnancy?.postnatalFollowupTtt ?? ''}
          placeholder="Follow-up treatment · علاج المتابعة"
          aria-label="Follow-up treatment"
        />
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
