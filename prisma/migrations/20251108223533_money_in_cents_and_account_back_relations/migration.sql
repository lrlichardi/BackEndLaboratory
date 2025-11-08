/*
  Warnings:

  - You are about to drop the `ExamItemRange` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Patient_email_key";

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "diabetico" BOOLEAN;
ALTER TABLE "Patient" ADD COLUMN "notes" TEXT;
ALTER TABLE "Patient" ADD COLUMN "tiroides" BOOLEAN;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ExamItemRange";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "PatientAccountEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testOrderId" TEXT,
    "orderItemId" TEXT,
    CONSTRAINT "PatientAccountEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatientAccountEntry_testOrderId_fkey" FOREIGN KEY ("testOrderId") REFERENCES "TestOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientAccountEntry_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamItemDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "refText" TEXT,
    "method" TEXT NOT NULL DEFAULT 'N/A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kind" TEXT,
    CONSTRAINT "ExamItemDef_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamItemDef" ("createdAt", "examTypeId", "id", "key", "kind", "label", "refText", "sortOrder", "unit", "updatedAt") SELECT "createdAt", "examTypeId", "id", "key", "kind", "label", "refText", "sortOrder", "unit", "updatedAt" FROM "ExamItemDef";
DROP TABLE "ExamItemDef";
ALTER TABLE "new_ExamItemDef" RENAME TO "ExamItemDef";
CREATE UNIQUE INDEX "ExamItemDef_examTypeId_key_key" ON "ExamItemDef"("examTypeId", "key");
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priceCents" INTEGER,
    "paidAtCreationCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TestOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("createdAt", "examTypeId", "id", "orderId", "updatedAt") SELECT "createdAt", "examTypeId", "id", "orderId", "updatedAt" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PatientAccountEntry_patientId_idx" ON "PatientAccountEntry"("patientId");

-- CreateIndex
CREATE INDEX "PatientAccountEntry_testOrderId_idx" ON "PatientAccountEntry"("testOrderId");

-- CreateIndex
CREATE INDEX "PatientAccountEntry_orderItemId_idx" ON "PatientAccountEntry"("orderItemId");
