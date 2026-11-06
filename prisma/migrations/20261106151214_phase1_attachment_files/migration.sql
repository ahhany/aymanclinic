-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT,
    "storagePath" TEXT NOT NULL,
    "type" TEXT,
    "fileName" TEXT NOT NULL DEFAULT '',
    "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attachment" ("createdAt", "id", "ownerId", "ownerType", "patientId", "storagePath", "type") SELECT "createdAt", "id", "ownerId", "ownerType", "patientId", "storagePath", "type" FROM "Attachment";
DROP TABLE "Attachment";
ALTER TABLE "new_Attachment" RENAME TO "Attachment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
