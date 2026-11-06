import { useState, type FormEvent } from 'react';
import { useApi } from '../../db/apiClient';
import type { EpisodeDto, NewbornDto } from '../../db/types';
import { useI18n } from '../../i18n';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface BabyRow {
  sex: string;
  birthWeightG: string;
  apgar1: string;
  apgar5: string;
  nicuAdmission: boolean;
}

const emptyBaby: BabyRow = { sex: '', birthWeightG: '', apgar1: '', apgar5: '', nicuAdmission: false };

/** Delivery & post-natal visit block — edits the pregnancy sub-object of an
 *  OBS episode. Prefilled from the current values; empty strings are omitted.
 *  Rich outcomes (E1–E3, D26): outcome, labour/CS detail, and per-baby rows. */
export function DeliveryForm({
  episodeId,
  pregnancy,
  newborns,
  onSaved,
}: {
  episodeId: string;
  pregnancy: EpisodeDto['pregnancy'];
  newborns: NewbornDto[];
  onSaved: () => void;
}) {
  const api = useApi();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [babies, setBabies] = useState<BabyRow[]>(() =>
    newborns.map((nb) => ({
      sex: nb.sex ?? '',
      birthWeightG: nb.birthWeightG != null ? String(nb.birthWeightG) : '',
      apgar1: nb.apgar1 != null ? String(nb.apgar1) : '',
      apgar5: nb.apgar5 != null ? String(nb.apgar5) : '',
      nicuAdmission: nb.nicuAdmission === true,
    })),
  );

  const date = (v: string | null | undefined) => v?.slice(0, 10) ?? '';

  function setBaby(i: number, patch: Partial<BabyRow>) {
    setBabies((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  }

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
        // Rich outcomes (E2/E3)
        outcome: str('outcome'),
        outcomeDate: str('outcomeDate'),
        outcomeGaWeeks: int('outcomeGaWeeks'),
        labourOnset: str('labourOnset'),
        csUrgency: str('csUrgency'),
        csIndication: str('csIndication'),
        // Newborns (E1) — the list replaces the episode's rows
        newborns: babies.map((b) => ({
          sex: b.sex || undefined,
          birthWeightG: b.birthWeightG ? parseInt(b.birthWeightG, 10) : undefined,
          apgar1: b.apgar1 ? parseInt(b.apgar1, 10) : undefined,
          apgar5: b.apgar5 ? parseInt(b.apgar5, 10) : undefined,
          nicuAdmission: b.nicuAdmission,
        })),
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
        Outcome · نتيجة الحمل <span className="font-normal normal-case text-slate-400">(optional · اختياري)</span>
      </h4>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="outcome"
          defaultValue={pregnancy?.outcome ?? ''}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Pregnancy outcome"
        >
          <option value="">Outcome · النتيجة</option>
          <option value="ongoing">Ongoing · مستمر</option>
          <option value="liveBirth">Live birth · ولادة حية</option>
          <option value="miscarriage">Miscarriage · إجهاض</option>
          <option value="stillbirth">Stillbirth · ولادة جنين ميت</option>
          <option value="top">TOP · إنهاء الحمل</option>
        </select>
        <Input
          name="outcomeDate"
          type="date"
          defaultValue={date(pregnancy?.outcomeDate)}
          aria-label="Outcome date"
          title="Outcome date"
        />
        <Input
          name="outcomeGaWeeks"
          type="number"
          min="4"
          max="45"
          defaultValue={pregnancy?.outcomeGaWeeks ?? ''}
          placeholder="GA at outcome (wks) · عمر الحمل"
          aria-label="Gestational age at outcome in weeks"
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        <select
          name="labourOnset"
          defaultValue={pregnancy?.labourOnset ?? ''}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="Onset of labour"
        >
          <option value="">Onset of labour · بداية المخاض</option>
          <option value="spontaneous">Spontaneous · تلقائي</option>
          <option value="induced">Induced · تحريض</option>
          <option value="electiveCS">Elective CS · قيصرية اختيارية</option>
        </select>
        <select
          name="csUrgency"
          defaultValue={pregnancy?.csUrgency ?? ''}
          className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
          aria-label="CS urgency"
        >
          <option value="">CS urgency · نوع القيصرية</option>
          <option value="elective">Elective · اختيارية</option>
          <option value="emergency">Emergency · طارئة</option>
        </select>
        <Input
          name="csIndication"
          defaultValue={pregnancy?.csIndication ?? ''}
          placeholder="CS indication · سبب القيصرية"
          aria-label="CS indication"
        />
      </div>
      <h4 className="pt-1 text-xs font-semibold uppercase tracking-wide text-clinic-steel">
        Newborns · المواليد <span className="font-normal normal-case text-slate-400">(optional · اختياري)</span>
      </h4>
      {babies.map((b, i) => (
        <div key={i} className="grid items-center gap-2 sm:grid-cols-6">
          <select
            value={b.sex}
            onChange={(e) => setBaby(i, { sex: e.target.value })}
            className="h-10 w-full rounded-md border border-clinic-line bg-white px-2 text-sm"
            aria-label={`Baby ${i + 1} sex`}
          >
            <option value="">Sex · الجنس</option>
            <option value="male">Male · ذكر</option>
            <option value="female">Female · أنثى</option>
          </select>
          <Input
            value={b.birthWeightG}
            onChange={(e) => setBaby(i, { birthWeightG: e.target.value })}
            type="number"
            min="300"
            max="7000"
            placeholder="Weight (g) · الوزن"
            aria-label={`Baby ${i + 1} birth weight in grams`}
          />
          <Input
            value={b.apgar1}
            onChange={(e) => setBaby(i, { apgar1: e.target.value })}
            type="number"
            min="0"
            max="10"
            placeholder="Apgar 1"
            aria-label={`Baby ${i + 1} Apgar at 1 minute`}
          />
          <Input
            value={b.apgar5}
            onChange={(e) => setBaby(i, { apgar5: e.target.value })}
            type="number"
            min="0"
            max="10"
            placeholder="Apgar 5"
            aria-label={`Baby ${i + 1} Apgar at 5 minutes`}
          />
          <label className="flex items-center gap-1.5 text-xs text-clinic-steel">
            <input
              type="checkbox"
              checked={b.nicuAdmission}
              onChange={(e) => setBaby(i, { nicuAdmission: e.target.checked })}
              className="h-4 w-4"
            />
            NICU · حضانة
          </label>
          <button
            type="button"
            onClick={() => setBabies((rows) => rows.filter((_, j) => j !== i))}
            className="justify-self-end text-xs text-clinic-red hover:underline"
          >
            ✕
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          onClick={() => setBabies((rows) => [...rows, { ...emptyBaby }])}
          className="rounded border border-dashed border-clinic-line px-2 py-1 text-xs text-slate-400 hover:border-clinic-blue hover:text-clinic-blue"
        >
          + Baby · مولود
        </button>
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
