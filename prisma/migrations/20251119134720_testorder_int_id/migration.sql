/*
  Warnings:

  - You are about to drop the `Sample` table. If the table is not empty, all the data it contains will be lost.
  - You are about to alter the column `orderId` on the `OrderItem` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `testOrderId` on the `PatientAccountEntry` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - The primary key for the `TestOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `TestOrder` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Sample";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" INTEGER NOT NULL,
    "examTypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "priceCents" INTEGER,
    "paidAtCreationCents" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "TestOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("createdAt", "examTypeId", "id", "orderId", "paidAtCreationCents", "priceCents", "updatedAt") SELECT "createdAt", "examTypeId", "id", "orderId", "paidAtCreationCents", "priceCents", "updatedAt" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE TABLE "new_PatientAccountEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testOrderId" INTEGER,
    "orderItemId" TEXT,
    CONSTRAINT "PatientAccountEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PatientAccountEntry_testOrderId_fkey" FOREIGN KEY ("testOrderId") REFERENCES "TestOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PatientAccountEntry_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PatientAccountEntry" ("amountCents", "createdAt", "description", "id", "kind", "orderItemId", "patientId", "testOrderId") SELECT "amountCents", "createdAt", "description", "id", "kind", "orderItemId", "patientId", "testOrderId" FROM "PatientAccountEntry";
DROP TABLE "PatientAccountEntry";
ALTER TABLE "new_PatientAccountEntry" RENAME TO "PatientAccountEntry";
CREATE INDEX "PatientAccountEntry_patientId_idx" ON "PatientAccountEntry"("patientId");
CREATE INDEX "PatientAccountEntry_testOrderId_idx" ON "PatientAccountEntry"("testOrderId");
CREATE INDEX "PatientAccountEntry_orderItemId_idx" ON "PatientAccountEntry"("orderItemId");
CREATE TABLE "new_TestOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "orderNumber" TEXT,
    "title" TEXT,
    "methodPay" TEXT,
    CONSTRAINT "TestOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TestOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_TestOrder" ("createdAt", "doctorId", "id", "methodPay", "notes", "orderNumber", "patientId", "status", "title", "updatedAt") SELECT "createdAt", "doctorId", "id", "methodPay", "notes", "orderNumber", "patientId", "status", "title", "updatedAt" FROM "TestOrder";
DROP TABLE "TestOrder";
ALTER TABLE "new_TestOrder" RENAME TO "TestOrder";
CREATE UNIQUE INDEX "TestOrder_orderNumber_key" ON "TestOrder"("orderNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
