-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TestOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
