import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL ??= 'file:./dev.db';
const p = new PrismaClient();

async function main() {
  const appts = await p.appointment.count();
  const diags = await p.diagnosis.count();
  const visitsWithNext = await p.visit.count({ where: { nextVisitDate: { not: null } } });
  const visitsWithLoc = await p.visit.count({ where: { location: { not: null } } });
  console.log(`appointments: ${appts} | diagnoses: ${diags} | visits with nextVisitDate: ${visitsWithNext} | visits with location: ${visitsWithLoc}`);
}

main().finally(() => p.$disconnect());
