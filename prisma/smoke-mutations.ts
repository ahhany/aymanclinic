// Mutation smoke test — run against the throwaway smoke.db via the dev server on :5199.
const BASE = 'http://localhost:5199/api';

async function req(path: string, opts: RequestInit = {}, token?: string) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(token ? { 'x-dev-token': token } : {}), ...opts.headers },
  });
  const body = (await res.json()) as Record<string, unknown>;
  return { status: res.status, body };
}

async function main() {
  const login = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'doctor@clinic.local', password: 'demo1234' }),
  });
  if (login.status !== 200) throw new Error('login failed');
  const token = (login.body as { token: string }).token;
  console.log('1. login OK');

  const created = await req(
    '/patients',
    {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'مريضة اختبار النظام',
        mobile: '01099999999',
        husbandName: 'زوج تجريبي',
        dateOfBirth: '1995-06-15',
        bloodGroup: 'O',
        rhType: '+',
        episodeType: 'OBS',
        lmpDate: '2026-08-01',
        gravida: 2,
        parity: 1,
        abortions: 0,
      }),
    },
    token,
  );
  console.log('2. create patient:', created.status, JSON.stringify(created.body));
  if (created.status !== 201) throw new Error('create patient failed');
  const patientId = (created.body as { id: string }).id;

  const detail = await req(`/patients/${patientId}`, {}, token);
  const ep = (detail.body as { episodes: Array<{ id: string; pregnancy: { eddDate: string | null } | null }> })
    .episodes[0];
  console.log('3. episode created, EDD auto-computed:', ep.pregnancy?.eddDate?.slice(0, 10));

  const visit = await req(
    `/episodes/${ep.id}/visits`,
    {
      method: 'POST',
      body: JSON.stringify({
        visitDate: '2026-11-06',
        weightKg: 70.5,
        bpSystolic: 118,
        bpDiastolic: 76,
        complaints: 'لا شكاوى',
        management: 'متابعة',
        nextVisitDate: '2026-12-04',
      }),
    },
    token,
  );
  console.log('4. add visit:', visit.status, JSON.stringify(visit.body));

  const lab = await req(
    `/episodes/${ep.id}/lab-reports`,
    {
      method: 'POST',
      body: JSON.stringify({
        reportDate: '2026-11-06',
        laboratoryName: 'معمل الاختبار',
        results: [
          { testCode: 'CBC_HB', value: 10.2 },
          { testCode: 'FERRITIN', value: 11 },
        ],
      }),
    },
    token,
  );
  console.log('5. add lab report:', lab.status, JSON.stringify(lab.body));

  const diag = await req(`/episodes/${ep.id}/diagnoses`, { method: 'POST', body: JSON.stringify({ label: 'Anemia in pregnancy (mild)' }) }, token);
  console.log('6. add diagnosis:', diag.status);

  const after = await req(`/patients/${patientId}`, {}, token);
  const p = after.body as {
    labReports: Array<{ results: Array<{ testCode: string; resultValue: number; unit: string; abnormalFlag: string }> }>;
    episodes: Array<{ visits: unknown[]; diagnoses: Array<{ label: string }> }>;
  };
  const hb = p.labReports[0].results.find((r) => r.testCode === 'CBC_HB');
  console.log(
    `7. verify: visits=${p.episodes[0].visits.length}, diagnoses=${p.episodes[0].diagnoses.length}, ` +
      `Hb=${hb?.resultValue} ${hb?.unit} flag=${hb?.abnormalFlag} (expect low)`,
  );

  const badTest = await req(
    `/episodes/${ep.id}/lab-reports`,
    { method: 'POST', body: JSON.stringify({ reportDate: '2026-11-06', results: [{ testCode: 'NOPE', value: 1 }] }) },
    token,
  );
  console.log('8. unknown testCode rejected:', badTest.status, JSON.stringify(badTest.body));
}

main().catch((e) => {
  console.error('SMOKE FAILED:', e.message);
  process.exit(1);
});
