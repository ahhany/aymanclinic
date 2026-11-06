// Seed: 10 FICTIONAL demo patients + test dictionary + demo users + starter medications.
// No real patient data may ever enter this repo or dev database (decision D16).

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/passwords';

// Same dev fallback as server/handler.ts — prisma CLI commands still need
// DATABASE_URL in the environment (see README).
process.env.DATABASE_URL ??= 'file:./dev.db';

const prisma = new PrismaClient();

// ---- test dictionary (knowledge/data-dictionary.md → seed panel) ----
const TEST_DEFINITIONS: Array<{
  testCode: string; testName: string; defaultUnit?: string; refLow?: number; refHigh?: number; panel: string; sortOrder: number;
}> = [
  { testCode: 'CBC_HB',  testName: 'Hemoglobin (Hb)',            defaultUnit: 'g/dL',  refLow: 12,   refHigh: 15.5, panel: 'cbc_basic',    sortOrder: 1 },
  { testCode: 'CBC_HCT', testName: 'Hematocrit (Hct)',           defaultUnit: '%',     refLow: 36,   refHigh: 46,   panel: 'cbc_basic',    sortOrder: 2 },
  { testCode: 'CBC_RBC', testName: 'RBC count',                  defaultUnit: '10^6/µL', refLow: 4.0, refHigh: 5.2,  panel: 'cbc_basic',    sortOrder: 3 },
  { testCode: 'CBC_MCV', testName: 'MCV',                        defaultUnit: 'fL',    refLow: 80,   refHigh: 100,  panel: 'cbc_basic',    sortOrder: 4 },
  { testCode: 'CBC_MCH', testName: 'MCH',                        defaultUnit: 'pg',    refLow: 27,   refHigh: 33,   panel: 'cbc_basic',    sortOrder: 5 },
  { testCode: 'CBC_MCHC',testName: 'MCHC',                       defaultUnit: 'g/dL',  refLow: 32,   refHigh: 36,   panel: 'cbc_basic',    sortOrder: 6 },
  { testCode: 'CBC_RDW', testName: 'RDW',                        defaultUnit: '%',     refLow: 11.5, refHigh: 14.5, panel: 'cbc_extended', sortOrder: 7 },
  { testCode: 'CBC_WBC', testName: 'TLC (WBC)',                  defaultUnit: '10^3/µL', refLow: 4.0, refHigh: 11.0, panel: 'cbc_basic',   sortOrder: 8 },
  { testCode: 'CBC_PLT', testName: 'Platelets',                  defaultUnit: '10^3/µL', refLow: 150, refHigh: 400, panel: 'cbc_basic',   sortOrder: 9 },
  { testCode: 'FERRITIN', testName: 'Ferritin',                  defaultUnit: 'ng/mL', refLow: 15,   refHigh: 150,  panel: 'obs_lab_row',  sortOrder: 10 },
  { testCode: 'SERUM_IRON', testName: 'Serum iron',              defaultUnit: 'µg/dL', refLow: 60,   refHigh: 170,  panel: 'additional',   sortOrder: 11 },
  { testCode: 'ALT',     testName: 'ALT',                        defaultUnit: 'U/L',   refLow: 0,    refHigh: 41,   panel: 'obs_lab_row',  sortOrder: 12 },
  { testCode: 'AST',     testName: 'AST',                        defaultUnit: 'U/L',   refLow: 0,    refHigh: 40,   panel: 'obs_lab_row',  sortOrder: 13 },
  { testCode: 'CREATININE', testName: 'Creatinine',              defaultUnit: 'mg/dL', refLow: 0.5,  refHigh: 0.9,  panel: 'obs_lab_row',  sortOrder: 14 },
  { testCode: 'UREA',    testName: 'Urea',                       defaultUnit: 'mg/dL', refLow: 15,   refHigh: 40,   panel: 'obs_lab_row',  sortOrder: 15 },
  { testCode: 'PT',      testName: 'Prothrombin time',           defaultUnit: 'sec',   refLow: 11,   refHigh: 13.5, panel: 'obs_lab_row',  sortOrder: 16 },
  { testCode: 'PC',      testName: 'Prothrombin concentration',  defaultUnit: '%',     refLow: 70,   refHigh: 120,  panel: 'obs_lab_row',  sortOrder: 17 },
  { testCode: 'FBS',     testName: 'Fasting blood sugar',        defaultUnit: 'mg/dL', refLow: 70,   refHigh: 92,   panel: 'obs_lab_row',  sortOrder: 18 },
  { testCode: 'PPBS',    testName: 'Postprandial blood sugar',   defaultUnit: 'mg/dL', refLow: 70,   refHigh: 120,  panel: 'obs_lab_row',  sortOrder: 19 },
  { testCode: 'URINE_ANALYSIS', testName: 'Urine analysis',      panel: 'obs_lab_row', sortOrder: 20 },
  { testCode: 'CALCIUM', testName: 'Calcium (Ca++)',             defaultUnit: 'mg/dL', refLow: 8.5,  refHigh: 10.5, panel: 'obs_lab_row',  sortOrder: 21 },
  { testCode: 'TSH',     testName: 'TSH',                        defaultUnit: 'mIU/L', refLow: 0.27, refHigh: 4.2,  panel: 'obs_lab_row',  sortOrder: 22 },
];

const MEDICATIONS = [
  { brandName: 'Feroglobin B12', activeIngredient: 'Iron + folic acid + B12', form: 'capsule', strength: 'standard' },
  { brandName: 'Ferose F',       activeIngredient: 'Iron + folic acid',       form: 'tablet',  strength: 'standard' },
  { brandName: 'Folic Acid',     activeIngredient: 'Folic acid',              form: 'tablet',  strength: '5 mg' },
  { brandName: 'Cetal',          activeIngredient: 'Paracetamol',             form: 'tablet',  strength: '500 mg' },
  { brandName: 'Aspocid',        activeIngredient: 'Acetylsalicylic acid',    form: 'tablet',  strength: '75 mg' },
  { brandName: 'Brufen',         activeIngredient: 'Ibuprofen',               form: 'tablet',  strength: '400 mg' },
  { brandName: 'Duphaston',      activeIngredient: 'Dydrogesterone',          form: 'tablet',  strength: '10 mg' },
  { brandName: 'Cyclogest',      activeIngredient: 'Progesterone',            form: 'pessary', strength: '400 mg' },
];

const days = (n: number) => new Date(Date.now() - n * 86_400_000);

// ---- fictional demo patients (Arabic names, entirely invented) ----
const PATIENTS = [
  { code: 1, name: 'منى محمد عبد الله', mobile: '01000000001', husband: 'أحمد سمير', dob: '1996-03-14',
    obs: { lmp: days(196), gravida: 2, parity: 1, abortions: 0, visits: [
      { ago: 120, wt: 68.5, sys: 110, dia: 70, complaints: 'ألم أسفل الظهر', management: 'متابعة روتينية', hb: 11.6, ferritin: 22 },
      { ago: 60,  wt: 71.2, sys: 115, dia: 75, complaints: 'دوخة خفيفة',    management: 'حديد + حمض فوليك', hb: 10.4, ferritin: 14 },
      { ago: 14,  wt: 73.8, sys: 120, dia: 80, complaints: 'لا شكاوى',       management: 'استمرار العلاج',  hb: 10.9, ferritin: 18 },
    ] } },
  { code: 2, name: 'سارة محمود حسن', mobile: '01000000002', husband: 'كريم فؤاد', dob: '1990-07-02',
    obs: { lmp: days(140), gravida: 1, parity: 0, abortions: 0, visits: [
      { ago: 42, wt: 62.0, sys: 105, dia: 65, complaints: 'غثيان صباحي', management: 'طمأنة + فيتامينات', hb: 12.3, ferritin: 40 },
      { ago: 7,  wt: 63.4, sys: 110, dia: 70, complaints: 'لا شكاوى',   management: 'متابعة',          hb: 11.8, ferritin: 35 },
    ] } },
  { code: 3, name: 'هدى عادل إبراهيم', mobile: '01000000003', husband: 'محمد نبيل', dob: '1988-11-25',
    obs: { lmp: days(230), gravida: 4, parity: 2, abortions: 1, visits: [
      { ago: 90, wt: 80.1, sys: 130, dia: 85, complaints: 'تورم القدمين', management: 'متابعة ضغط',       hb: 10.2, ferritin: 9 },
      { ago: 30, wt: 82.7, sys: 125, dia: 80, complaints: 'إرهاق',        management: 'حديد وريدي مقترح', hb: 9.8,  ferritin: 7 },
    ] } },
  { code: 4, name: 'رانيا سعيد توفيق', mobile: '01000000004', husband: 'هشام جلال', dob: '1994-01-30',
    obs: { lmp: days(98), gravida: 2, parity: 0, abortions: 1, visits: [
      { ago: 21, wt: 59.3, sys: 100, dia: 60, complaints: 'لا شكاوى', management: 'سونار أول', hb: 12.9, ferritin: 55 },
    ] } },
  { code: 5, name: 'دينا خالد فهمي', mobile: '01000000005', husband: 'عمرو طارق', dob: '1999-05-18',
    obs: { lmp: days(168), gravida: 1, parity: 0, abortions: 0, visits: [
      { ago: 50, wt: 66.0, sys: 118, dia: 78, complaints: 'حرقان بول', management: 'مزرعة بول', hb: 10.7, ferritin: 12 },
      { ago: 10, wt: 67.9, sys: 115, dia: 75, complaints: 'تحسن',      management: 'استكمال علاج', hb: 11.1, ferritin: 15 },
    ] } },
  { code: 6, name: 'نهى حسن علي', mobile: '01000000006', husband: 'طارق عز الدين', dob: '1992-09-09',
    obs: { lmp: days(84), gravida: 3, parity: 1, abortions: 1, visits: [
      { ago: 28, wt: 71.0, sys: 108, dia: 68, complaints: 'قيء متكرر', management: 'مضاد قيء', hb: 11.4, ferritin: 28 },
    ] } },
  // GYN patients
  { code: 7, name: 'إيمان رمضان عبد العزيز', mobile: '01000000007', husband: 'سامح فريد', dob: '1987-04-12',
    gyn: { marriedFor: '6 سنوات', contraception: 'لا شيء', menstrual: 'منتظمة 28 يوم',
      semen: [{ lab: 'معمل البرج (افتراضي)', ago: 45, count: 32, a: 25, b: 20, c: 30, d: 25, ab: 86 }],
      visits: [{ ago: 45, complaints: 'تأخر إنجاب أولي', management: 'تحاليل + سونار' }] } },
  { code: 8, name: 'أمنية فاروق الشاذلي', mobile: '01000000008', husband: 'وليد مراد', dob: '1993-12-03',
    gyn: { marriedFor: '3 سنوات', contraception: 'حبوب سابقاً', menstrual: 'غير منتظمة 35-45 يوم',
      semen: [],
      visits: [
        { ago: 70, complaints: 'عدم انتظام دورة', management: 'تحليل هرمونات' },
        { ago: 20, complaints: 'تحسن جزئي',      management: 'تنظيم دورة 3 شهور' },
      ] } },
  { code: 9, name: 'شيماء أشرف كامل', mobile: '01000000009', husband: 'مصطفى رضوان', dob: '1985-08-21',
    gyn: { marriedFor: '10 سنوات', contraception: 'لولب سابقاً', menstrual: 'منتظمة',
      semen: [{ lab: 'معمل المختبر (افتراضي)', ago: 100, count: 18, a: 15, b: 25, c: 35, d: 25, ab: 92 }],
      visits: [{ ago: 100, complaints: 'تأخر إنجاب ثانوي', management: 'تقييم زوجي' }] } },
  { code: 10, name: 'غادة ناصر سليمان', mobile: '01000000010', husband: 'شريف أنور', dob: '1997-02-14',
    gyn: { marriedFor: 'سنتان', contraception: 'لا شيء', menstrual: 'منتظمة 30 يوم',
      semen: [],
      visits: [{ ago: 15, complaints: 'ألم دورة شديد', management: 'مسكن + سونار حوض' }] } },
];

async function main() {
  console.log('Seeding test definitions…');
  for (const td of TEST_DEFINITIONS) {
    await prisma.testDefinition.upsert({ where: { testCode: td.testCode }, update: td, create: td });
  }

  console.log('Seeding users…');
  for (const u of [
    { email: 'doctor@clinic.local', name: 'Dr. Ayman Hany (demo)', role: 'doctor' },
    { email: 'reception@clinic.local', name: 'Reception (demo)', role: 'reception' },
  ]) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { ...u, passwordHash: hashPassword('demo1234') },
    });
  }

  console.log('Seeding medications…');
  const meds = new Map<string, string>();
  for (const m of MEDICATIONS) {
    const rec = await prisma.medication.upsert({
      where: { brandName_strength: { brandName: m.brandName, strength: m.strength } },
      update: m,
      create: m,
    });
    meds.set(m.brandName, rec.id);
  }

  console.log('Seeding fictional patients…');
  for (const p of PATIENTS) {
    const patientCode = `AYC-${String(p.code).padStart(6, '0')}`;
    const existing = await prisma.patient.findUnique({ where: { patientCode } });
    if (existing) continue; // idempotent

    const patient = await prisma.patient.create({
      data: {
        patientCode,
        anonymousId: `ANON-${String(p.code).padStart(6, '0')}`,
        dateOfBirth: new Date(p.dob),
        identity: { create: { fullName: p.name, mobile: p.mobile, husbandName: p.husband } },
      },
    });

    if ('obs' in p && p.obs) {
      const episode = await prisma.episode.create({
        data: {
          patientId: patient.id,
          type: 'OBS',
          pregnancy: {
            create: {
              lmpDate: p.obs.lmp,
              eddDate: new Date(p.obs.lmp.getTime() + 280 * 86_400_000),
              gravida: p.obs.gravida,
              parity: p.obs.parity,
              abortions: p.obs.abortions,
              conceptionType: 'spontaneous',
            },
          },
        },
      });
      for (const v of p.obs.visits) {
        const visit = await prisma.visit.create({
          data: {
            episodeId: episode.id,
            visitDate: days(v.ago),
            weightKg: v.wt,
            bpSystolic: v.sys,
            bpDiastolic: v.dia,
            complaints: v.complaints,
            management: v.management,
          },
        });
        const report = await prisma.labReport.create({
          data: {
            patientId: patient.id,
            episodeId: episode.id,
            visitId: visit.id,
            reportDate: days(v.ago),
            laboratoryName: 'معمل افتراضي',
            sourceType: 'manual',
            results: {
              create: [
                { testCode: 'CBC_HB', testName: 'Hemoglobin (Hb)', resultValue: v.hb, unit: 'g/dL', refLow: 12, refHigh: 15.5, abnormalFlag: v.hb < 12 ? 'low' : 'normal', verificationStatus: 'manual' },
                { testCode: 'FERRITIN', testName: 'Ferritin', resultValue: v.ferritin, unit: 'ng/mL', refLow: 15, refHigh: 150, abnormalFlag: v.ferritin < 15 ? 'low' : 'normal', verificationStatus: 'manual' },
              ],
            },
          },
        });
        void report;
        if (v.hb < 11.5) {
          await prisma.prescription.create({
            data: {
              episodeId: episode.id,
              visitId: visit.id,
              medicationId: meds.get('Ferose F')!,
              prescriptionDate: days(v.ago),
              dose: '1 tab',
              frequency: 'once daily',
              route: 'oral',
              durationDays: 90,
              indication: 'anemia in pregnancy',
            },
          });
        }
      }
    }

    if ('gyn' in p && p.gyn) {
      const episode = await prisma.episode.create({
        data: {
          patientId: patient.id,
          type: 'GYN',
          gyn: {
            create: {
              marriedFor: p.gyn.marriedFor,
              contraception: p.gyn.contraception,
              menstrualHistory: p.gyn.menstrual,
            },
          },
        },
      });
      for (const s of p.gyn.semen) {
        await prisma.semenAnalysis.create({
          data: {
            episodeId: episode.id,
            labName: s.lab,
            analysisDate: days(s.ago),
            countMPerMl: s.count,
            motilityAPct: s.a,
            motilityBPct: s.b,
            motilityCPct: s.c,
            motilityDPct: s.d,
            abnormalFormsPct: s.ab,
          },
        });
      }
      for (const v of p.gyn.visits) {
        await prisma.visit.create({
          data: { episodeId: episode.id, visitDate: days(v.ago), complaints: v.complaints, management: v.management },
        });
      }
    }
  }

  const count = await prisma.patient.count();
  console.log(`Seed complete — ${count} fictional patients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
