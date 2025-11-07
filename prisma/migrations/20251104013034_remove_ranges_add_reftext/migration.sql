/*
  Warnings:

  - You are about to drop the column `description` on the `ExamType` table. All the data in the column will be lost.
  - You are about to drop the column `refRange` on the `ExamType` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `ExamType` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `OrderItem` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "ExamItemDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "examTypeId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "refText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kind" TEXT,
    CONSTRAINT "ExamItemDef_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExamItemRange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "sex" TEXT,
    "minAgeDays" INTEGER,
    "maxAgeDays" INTEGER,
    "low" REAL,
    "high" REAL,
    "expectedText" TEXT,
    "note" TEXT,
    CONSTRAINT "ExamItemRange_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ExamItemDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItemAnalyte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderItemId" TEXT NOT NULL,
    "itemDefId" TEXT NOT NULL,
    "valueNum" REAL,
    "valueText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "unit" TEXT,
    "refLow" REAL,
    "refHigh" REAL,
    "refExpected" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrderItemAnalyte_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItemAnalyte_itemDefId_fkey" FOREIGN KEY ("itemDefId") REFERENCES "ExamItemDef" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ExamType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isPanel" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_ExamType" ("code", "id", "name") SELECT "code", "id", "name" FROM "ExamType";
DROP TABLE "ExamType";
ALTER TABLE "new_ExamType" RENAME TO "ExamType";
CREATE UNIQUE INDEX "ExamType_code_key" ON "ExamType"("code");
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TestOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("examTypeId", "id", "orderId") SELECT "examTypeId", "id", "orderId" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_Result" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderItemId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "observedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unit" TEXT,
    "refRange" TEXT,
    CONSTRAINT "Result_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Result" ("id", "observedAt", "orderItemId", "refRange", "unit", "value") SELECT "id", "observedAt", "orderItemId", "refRange", "unit", "value" FROM "Result";
DROP TABLE "Result";
ALTER TABLE "new_Result" RENAME TO "Result";
CREATE UNIQUE INDEX "Result_orderItemId_key" ON "Result"("orderItemId");
CREATE INDEX "Result_orderItemId_idx" ON "Result"("orderItemId");
CREATE TABLE "new_Sample" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "collectedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Sample_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TestOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Sample" ("collectedAt", "id", "notes", "orderId", "sampleType") SELECT "collectedAt", "id", "notes", "orderId", "sampleType" FROM "Sample";
DROP TABLE "Sample";
ALTER TABLE "new_Sample" RENAME TO "Sample";
CREATE TABLE "new_TestOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "orderNumber" TEXT,
    "title" TEXT,
    CONSTRAINT "TestOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TestOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TestOrder" ("createdAt", "doctorId", "id", "notes", "orderNumber", "patientId", "status", "title") SELECT "createdAt", "doctorId", "id", "notes", "orderNumber", "patientId", "status", "title" FROM "TestOrder";
DROP TABLE "TestOrder";
ALTER TABLE "new_TestOrder" RENAME TO "TestOrder";
CREATE UNIQUE INDEX "TestOrder_orderNumber_key" ON "TestOrder"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ExamItemDef_examTypeId_key_key" ON "ExamItemDef"("examTypeId", "key");

-- CreateIndex
CREATE INDEX "OrderItemAnalyte_orderItemId_idx" ON "OrderItemAnalyte"("orderItemId");

-- CreateIndex
CREATE INDEX "OrderItemAnalyte_itemDefId_idx" ON "OrderItemAnalyte"("itemDefId");
