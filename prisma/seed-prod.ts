// Production seed (see knowledge/deployment-plan.md): reference data
// (test dictionary + starter medications) and the REAL doctor account.
// The weak demo logins are NEVER created here.
//
// Required env:
//   DATABASE_URL    — Supabase Postgres (session/transaction pooler URI)
//   DOCTOR_EMAIL    — Dr. Ayman's login email
//   DOCTOR_PASSWORD — strong password (min 10 chars)
// Optional env:
//   DOCTOR_NAME     — display name (default "Dr. Ayman Hany")
//   SEED_DEMO=1     — also load the 10 FICTIONAL patients for the acceptance
//                     test (D16 gate). Remove them before real records.

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/passwords';
import { seedTestDefinitions, seedMedications, seedFictionalPatients } from './seed-data';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required (point it at Supabase).');
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding reference data (test definitions, medications)…');
  await seedTestDefinitions(prisma);
  const meds = await seedMedications(prisma);

  const email = process.env.DOCTOR_EMAIL?.trim().toLowerCase();
  const password = process.env.DOCTOR_PASSWORD;
  const name = process.env.DOCTOR_NAME?.trim() || 'Dr. Ayman Hany';
  if (!email || !email.includes('@')) {
    console.error('Set DOCTOR_EMAIL to a valid email.');
    process.exit(1);
  }
  if (!password || password.length < 10) {
    console.error('Set DOCTOR_PASSWORD (min 10 characters).');
    process.exit(1);
  }
  await prisma.user.upsert({
    where: { email },
    update: { name, role: 'doctor', passwordHash: hashPassword(password) },
    create: { email, name, role: 'doctor', passwordHash: hashPassword(password) },
  });
  console.log(`Doctor user ready: ${email}`);

  if (process.env.SEED_DEMO === '1') {
    console.log('Seeding fictional demo patients (acceptance-test set, D16)…');
    await seedFictionalPatients(prisma, meds);
  }

  console.log('Production seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
