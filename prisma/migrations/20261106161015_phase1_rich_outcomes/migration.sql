-- AlterTable
ALTER TABLE "Diagnosis" ADD COLUMN "category" TEXT;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "heightCm" REAL;

-- AlterTable
ALTER TABLE "PregnancyDetails" ADD COLUMN "csIndication" TEXT;
ALTER TABLE "PregnancyDetails" ADD COLUMN "csUrgency" TEXT;
ALTER TABLE "PregnancyDetails" ADD COLUMN "labourOnset" TEXT;
ALTER TABLE "PregnancyDetails" ADD COLUMN "outcome" TEXT;
ALTER TABLE "PregnancyDetails" ADD COLUMN "outcomeDate" DATETIME;
ALTER TABLE "PregnancyDetails" ADD COLUMN "outcomeGaWeeks" INTEGER;

-- CreateTable
CREATE TABLE "Newborn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sex" TEXT,
    "birthWeightG" INTEGER,
    "apgar1" INTEGER,
    "apgar5" INTEGER,
    "nicuAdmission" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Newborn_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
