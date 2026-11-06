import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL ??= 'file:./dev.db';
const p = new PrismaClient();

async function main() {
  const count = await p.patient.count();
  const byId = await p.patient.findUnique({
    where: { id: '1e700e1d-b617-4674-96f2-e451c6121c05' },
    include: { identity: true },
  });
  console.log(`patients: ${count}`);
  console.log(byId ? `tab patient EXISTS: ${byId.patientCode} ${byId.identity?.fullName}` : 'tab patient NOT FOUND');
}

main().finally(() => p.$disconnect());
