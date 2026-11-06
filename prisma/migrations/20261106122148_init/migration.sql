-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientCode" TEXT NOT NULL,
    "anonymousId" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "bloodGroup" TEXT,
    "rhType" TEXT,
    "pastHistory" TEXT,
    "familyHistory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PatientIdentity" (
    "patientId" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "mobile" TEXT,
    "address" TEXT,
    "husbandName" TEXT,
    CONSTRAINT "PatientIdentity_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    CONSTRAINT "Episode_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PregnancyDetails" (
    "episodeId" TEXT NOT NULL PRIMARY KEY,
    "lmpDate" DATETIME,
    "eddDate" DATETIME,
    "gravida" INTEGER,
    "parity" INTEGER,
    "abortions" INTEGER,
    "conceptionType" TEXT,
    "marriedFor" TEXT,
    "deliveryDate" DATETIME,
    "hospital" TEXT,
    "deliveryMode" TEXT,
    "anesthesia" TEXT,
    "maternalComplications" TEXT,
    "fetalComplications" TEXT,
    "fetalSex" TEXT,
    "postnatalDate" DATETIME,
    "postnatalPayment" TEXT,
    "postnatalScar" TEXT,
    "postnatalComplications" TEXT,
    "postnatalFollowupTtt" TEXT,
    CONSTRAINT "PregnancyDetails_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GynDetails" (
    "episodeId" TEXT NOT NULL PRIMARY KEY,
    "marriedFor" TEXT,
    "contraception" TEXT,
    "menstrualHistory" TEXT,
    "lmpDate" DATETIME,
    "remarks" TEXT,
    CONSTRAINT "GynDetails_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ObstetricHistoryRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER,
    "duration" TEXT,
    "pregnancyNote" TEXT,
    "complications" TEXT,
    "deliveryMode" TEXT,
    "postPartum" TEXT,
    CONSTRAINT "ObstetricHistoryRow_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UltrasoundMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "scanDate" DATETIME,
    "operator" TEXT,
    "place" TEXT,
    "payloadJson" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UltrasoundMilestone_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemenAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "labName" TEXT,
    "analysisDate" DATETIME,
    "countMPerMl" REAL,
    "motilityAPct" REAL,
    "motilityBPct" REAL,
    "motilityCPct" REAL,
    "motilityDPct" REAL,
    "abnormalFormsPct" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemenAnalysis_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "visitDate" DATETIME NOT NULL,
    "weightKg" REAL,
    "bpSystolic" INTEGER,
    "bpDiastolic" INTEGER,
    "ultrasoundNote" TEXT,
    "complaints" TEXT,
    "management" TEXT,
    "nextVisit" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Visit_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "episodeId" TEXT,
    "visitId" TEXT,
    "reportDate" DATETIME NOT NULL,
    "laboratoryName" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "originalFileId" TEXT,
    "aiExtractionStatus" TEXT NOT NULL DEFAULT 'none',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LabReport_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LabReport_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LabReport_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "labReportId" TEXT NOT NULL,
    "testCode" TEXT NOT NULL,
    "testName" TEXT NOT NULL,
    "resultValue" REAL,
    "resultText" TEXT,
    "unit" TEXT,
    "refLow" REAL,
    "refHigh" REAL,
    "abnormalFlag" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'manual',
    "verifiedAt" DATETIME,
    CONSTRAINT "LabResult_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "LabReport" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TestDefinition" (
    "testCode" TEXT NOT NULL PRIMARY KEY,
    "testName" TEXT NOT NULL,
    "defaultUnit" TEXT,
    "refLow" REAL,
    "refHigh" REAL,
    "panel" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "brandName" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "form" TEXT,
    "strength" TEXT
);

-- CreateTable
CREATE TABLE "Prescription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "episodeId" TEXT NOT NULL,
    "visitId" TEXT,
    "medicationId" TEXT NOT NULL,
    "prescriptionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dose" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "durationDays" INTEGER,
    "indication" TEXT,
    "discontinuedAt" DATETIME,
    CONSTRAINT "Prescription_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prescription_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Prescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT,
    "storagePath" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "detail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_anonymousId_key" ON "Patient"("anonymousId");

-- CreateIndex
CREATE UNIQUE INDEX "Medication_brandName_strength_key" ON "Medication"("brandName", "strength");
