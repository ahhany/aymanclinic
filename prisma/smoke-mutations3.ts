// Mutation smoke test 3 — slice 3 endpoints (attachments, dashboards).
// Runs against the throwaway smoke.db via the dev server on :5199.
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

  const patients = await req('/patients', {}, token);
  const patientId = (patients.body as Array<{ id: string }>)[0].id;

  // --- attachment upload (multipart) ---
  const fileBytes = new TextEncoder().encode('fake-png-bytes-for-smoke');
  const form = new FormData();
  form.append('file', new Blob([fileBytes], { type: 'image/png' }), 'scan-اختبار.png');
  form.append('type', 'ultrasound');
  form.append('note', 'smoke note');
  const up = await fetch(`${BASE}/patients/${patientId}/attachments`, {
    method: 'POST',
    headers: { 'x-dev-token': token },
    body: form,
  });
  assert(up.status === 201, `upload (got ${up.status})`);
  const attachmentId = ((await up.json()) as { id: string }).id;
  console.log('2. attachment uploaded:', attachmentId.slice(0, 8) + '…');

  // --- attachment appears in patient detail ---
  const detail = await req(`/patients/${patientId}`, {}, token);
  const atts = (detail.body as { attachments: Array<{ id: string; fileName: string; type: string; sizeBytes: number }> })
    .attachments;
  const att = atts.find((a) => a.id === attachmentId);
  assert(!!att, 'attachment in patient detail');
  assert(att!.fileName === 'scan-اختبار.png' && att!.type === 'ultrasound' && att!.sizeBytes === fileBytes.length,
    `attachment metadata (got ${att!.fileName}, ${att!.type}, ${att!.sizeBytes})`);
  console.log('3. attachment metadata in patient detail (unicode name intact)');

  // --- download via ?token= ---
  const dl = await fetch(`${BASE}/attachments/${attachmentId}/file?token=${token}`);
  assert(dl.status === 200, `download (got ${dl.status})`);
  assert(dl.headers.get('content-type') === 'image/png', 'download content-type');
  const got = new Uint8Array(await dl.arrayBuffer());
  assert(got.length === fileBytes.length && got[0] === fileBytes[0], 'download bytes match');
  console.log('4. attachment downloaded via query token, bytes match');

  // --- reject disallowed type ---
  const badForm = new FormData();
  badForm.append('file', new Blob([fileBytes], { type: 'application/x-msdownload' }), 'evil.exe');
  const badUp = await fetch(`${BASE}/patients/${patientId}/attachments`, {
    method: 'POST',
    headers: { 'x-dev-token': token },
    body: badForm,
  });
  assert(badUp.status === 415, `exe rejected (got ${badUp.status})`);
  console.log('5. disallowed mime type rejected with 415');

  // --- delete ---
  const del = await fetch(`${BASE}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { 'x-dev-token': token },
  });
  assert(del.status === 200, 'delete');
  const dlAfter = await fetch(`${BASE}/attachments/${attachmentId}/file?token=${token}`);
  assert(dlAfter.status === 404, 'file gone after delete');
  console.log('6. attachment deleted, download now 404');

  // --- dashboards ---
  const admin = await req('/dashboards/admin', {}, token);
  assert(admin.status === 200, 'dashboards/admin');
  const a = admin.body as {
    today: { total: number; byStatus: Record<string, number> };
    week: Array<{ date: string; count: number }>;
    newPatientsPerMonth: Array<{ month: string; count: number }>;
    overdueFollowUps: { count: number; rows: unknown[] };
  };
  assert(typeof a.today.total === 'number' && a.week.length === 7 && a.newPatientsPerMonth.length === 6,
    'admin shape');
  console.log(`7. dashboards/admin: today=${a.today.total}, week days=${a.week.length}, overdue=${a.overdueFollowUps.count}`);

  const clinical = await req('/dashboards/clinical', {}, token);
  assert(clinical.status === 200, 'dashboards/clinical');
  const c = clinical.body as {
    pregnancies: { total: number; buckets: Array<{ key: string; count: number }> };
    anemia: { tested: number };
    topDiagnoses: Array<{ label: string; count: number }>;
  };
  assert(c.pregnancies.buckets.length === 4 && Array.isArray(c.topDiagnoses), 'clinical shape');
  console.log(`8. dashboards/clinical: active pregnancies=${c.pregnancies.total}, tested for anemia=${c.anemia.tested}, diagnoses=${c.topDiagnoses.length}`);

  const rx = await req('/dashboards/prescribing', {}, token);
  assert(rx.status === 200, 'dashboards/prescribing');
  const r = rx.body as {
    topMedications: Array<{ brandName: string; count: number }>;
    prescriptionsPerMonth: Array<{ month: string; count: number }>;
    library: { total: number; percentPrescribed: number };
  };
  assert(r.topMedications.length > 0 && r.prescriptionsPerMonth.length === 6 && r.library.total === 8,
    'prescribing shape');
  console.log(`9. dashboards/prescribing: top med=${r.topMedications[0].brandName} (${r.topMedications[0].count}), library=${r.library.total}`);

  console.log('SMOKE 3 OK — 9 checks passed');
}

main().catch((e) => {
  console.error('SMOKE 3 FAILED:', e.message);
  process.exit(1);
});
