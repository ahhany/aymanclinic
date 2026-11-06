// Seed: 10 FICTIONAL demo patients + test dictionary + demo users + starter medications.
// No real patient data may ever enter this repo or dev database (decision D16).
// Data lives in seed-data.ts (shared with the production seed).

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../server/passwords';
import { seedTestDefinitions, seedMedications, seedFictionalPatients } from './seed-data';

// Same dev fallback as server/handler.ts — prisma CLI commands still need
// DATABASE_URL in the environment (see README).
process.env.DATABASE_URL ??= 'file:./dev.db';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding test definitions…');
  await seedTestDefinitions(prisma);

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
  const meds = await seedMedications(prisma);

  console.log('Seeding fictional patients…');
  await seedFictionalPatients(prisma, meds);

  const count = await prisma.patient.count();
  console.log(`Seed complete — ${count} fictional patients.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
