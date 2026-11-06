// Mutation smoke test 2 — Phase 1 slice 2 endpoints (medications, prescriptions,
// obstetric history, ultrasounds, delivery). Runs against the throwaway smoke.db
// via the dev server on :5199.
const BASE = 'http://localhost:5199/api';

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dev-token': token } : {}), ...opts.headers },
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`assertion failed: ${msg}`);
}

async function main() {
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'doctor@clinic.local', password: 'demo1234' }),
  });
  assert(login.status === 200, 'login');
  const token = (login.body as { token: string }).token;
  console.log('1. login OK');

  // --- medication library ---
  const meds = await req('/medications', {}, token);
  assert(meds.status === 200 && Array.isArray(meds.body), 'GET medications');
  const medList = meds.body as unknown as Array<{ id: string; brandName: string; prescriptionCount: number }>;
  assert(medList.length === 8, `seeded medication count (got ${medList.length})`);
  console.log(`2. GET medications: ${medList.length} seeded`);

  const newMed = await req(
    '/medications',
    { method: 'POST', body: JSON.stringify({ brandName: 'TestGesic', activeIngredient: 'Paracetamol', form: 'tablet', strength: '500 mg' }) },
    token,
  );
  assert(newMed.status === 201, 'POST medications');
  const dupMed = await req(
    '/medications',
    { method: 'POST', body: JSON.stringify({ brandName: 'TestGesic', activeIngredient: 'Paracetamol', form: 'tablet', strength: '500 mg' }) },
    token,
  );
  assert(dupMed.status === 409, 'duplicate medication rejected');
  console.log('3. POST medications: created + duplicate rejected with 409');

  // --- use the first OBS episode of the first patient ---
  const patients = await req('/patients', {}, token);
  const firstId = (patients.body as Array<{ id: string }>)[0].id;
  const detail = await req(`/patients/${firstId}`, {}, token);
  const p0 = detail.body as {
    episodes: Array<{ id: string; type: string; pregnancy: unknown }>;
  };
  const obs = p0.episodes.find((e) => e.type === 'OBS')!;
  console.log(`4. using OBS episode ${obs.id.slice(0, 8)}…`);

  // --- prescriptions: library path + inline-new-medication path ---
  const rx1 = await req(
    `/episodes/${obs.id}/prescriptions`,
    {
      method: 'POST',
      body: JSON.stringify({
        medicationId: medList[0].id,
        dose: '1 tablet',
        frequency: '3 times daily',
        durationDays: 7,
        indication: 'اختبار',
      }),
    },
    token,
  );
  assert(rx1.status === 201, 'POST prescription (library)');
  const rx1Id = (rx1.body as { id: string }).id;
  const rx2 = await req(
    `/episodes/${obs.id}/prescriptions`,
    {
      method: 'POST',
      body: JSON.stringify({
        newMedication: { brandName: 'InlineMed', activeIngredient: 'Iron', strength: '100 mg' },
        dose: '1 tablet daily',
      }),
    },
    token,
  );
  assert(rx2.status === 201, 'POST prescription (inline new medication)');
  const rx2Id = (rx2.body as { id: string }).id;
  console.log('5. prescriptions: library + inline-new-medication both accepted');

  // --- obstetric history row ---
  const obh = await req(
    `/patients/${firstId}/obstetric-history`,
    {
      method: 'POST',
      body: JSON.stringify({
        year: 2023,
        duration: '9 months',
        deliveryMode: 'vaginal',
        complications: 'none',
        postPartum: 'uneventful',
      }),
    },
    token,
  );
  assert(obh.status === 201, 'POST obstetric-history');
  console.log('6. obstetric history row added');

  // --- ultrasound milestone: bogus key must be dropped ---
  const us = await req(
    `/episodes/${obs.id}/ultrasounds`,
    {
      method: 'POST',
      body: JSON.stringify({
        type: 'nt_scan',
        scanDate: '2026-09-15',
        operator: 'Dr. Test',
        values: { ntMm: 1.4, nasalBone: 'present', sex: 'female', bogusKey: 'should-be-dropped' },
      }),
    },
    token,
  );
  assert(us.status === 201, 'POST ultrasounds');
  const badType = await req(
    `/episodes/${obs.id}/ultrasounds`,
    { method: 'POST', body: JSON.stringify({ type: 'nonsense', values: {} }) },
    token,
  );
  assert(badType.status === 400, 'invalid ultrasound type rejected');
  console.log('7. ultrasound milestone saved, invalid type rejected');

  // --- delivery upsert (incl. rich outcomes + newborns, D26) ---
  const put = await req(
    `/episodes/${obs.id}/pregnancy`,
    {
      method: 'PUT',
      body: JSON.stringify({
        deliveryDate: '2026-11-01',
        hospital: 'Test Hospital',
        deliveryMode: 'cs',
        fetalSex: 'female',
        postnatalDate: '2026-11-06',
        outcome: 'liveBirth',
        outcomeDate: '2026-11-01',
        outcomeGaWeeks: 38,
        labourOnset: 'electiveCS',
        csUrgency: 'elective',
        csIndication: 'Previous CS',
        newborns: [
          { sex: 'female', birthWeightG: 3100, apgar1: 8, apgar5: 9, nicuAdmission: false },
          { sex: 'male', birthWeightG: 2900, apgar1: 7, apgar5: 9, nicuAdmission: true },
        ],
      }),
    },
    token,
  );
  assert(put.status === 200, 'PUT pregnancy');

  // --- verify everything landed in patient detail ---
  const after = await req(`/patients/${firstId}`, {}, token);
  const p = after.body as {
    obstetricHistory: Array<{ year: number | null; deliveryMode: string | null }>;
    episodes: Array<{
      id: string;
      type: string;
      pregnancy: { deliveryDate: string | null; deliveryMode: string | null; outcome: string | null; csUrgency: string | null } | null;
      ultrasounds: Array<{ type: string; payloadJson: string }>;
      newborns: Array<{ sex: string | null; birthWeightG: number | null; nicuAdmission: boolean | null }>;
      prescriptions: Array<{ id: string; dose: string | null; medication: { brandName: string } }>;
    }>;
  };
  const ep = p.episodes.find((e) => e.id === obs.id)!;
  assert(p.obstetricHistory.some((r) => r.year === 2023), 'obstetric row persisted');
  assert(ep.prescriptions.some((r) => r.id === rx1Id), 'library prescription persisted');
  assert(ep.prescriptions.some((r) => r.id === rx2Id), 'inline prescription persisted');
  assert(ep.prescriptions.some((r) => r.medication.brandName === 'InlineMed'), 'inline medication linked');
  const milestone = ep.ultrasounds.find((u) => u.type === 'nt_scan')!;
  const payload = JSON.parse(milestone.payloadJson) as Record<string, unknown>;
  assert(payload.ntMm === 1.4 && payload.nasalBone === 'present', 'ultrasound payload values kept');
  assert(!('bogusKey' in payload), 'bogus ultrasound key dropped');
  assert(ep.pregnancy?.deliveryDate?.slice(0, 10) === '2026-11-01', 'delivery date persisted');
  assert(ep.pregnancy?.deliveryMode === 'cs', 'delivery mode persisted');
  assert(ep.pregnancy?.outcome === 'liveBirth' && ep.pregnancy?.csUrgency === 'elective', 'outcome/CS fields persisted');
  assert(ep.newborns.length === 2, 'newborns persisted');
  assert(ep.newborns[0].birthWeightG === 3100 && ep.newborns[1].nicuAdmission === true, 'newborn values persisted');
  console.log('8. patient detail verifies: obx history, 2 prescriptions, U/S payload (bogus key dropped), delivery + outcome + 2 newborns');

  console.log('SMOKE 2 OK — 8 checks passed');
}

main().catch((e) => {
  console.error('SMOKE 2 FAILED:', e.message);
  process.exit(1);
});
