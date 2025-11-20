/*
  Warnings:

  - You are about to drop the column `notes` on the `Patient` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "PatientNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PatientNote_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "sex" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "obraSocial" TEXT,
    "codigoAfiliado" TEXT,
    "diabetico" BOOLEAN,
    "tiroides" BOOLEAN,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Patient" ("address", "birthDate", "codigoAfiliado", "createdAt", "diabetico", "dni", "email", "firstName", "id", "lastName", "obraSocial", "phone", "sex", "tiroides", "updatedAt") SELECT "address", "birthDate", "codigoAfiliado", "createdAt", "diabetico", "dni", "email", "firstName", "id", "lastName", "obraSocial", "phone", "sex", "tiroides", "updatedAt" FROM "Patient";
DROP TABLE "Patient";
ALTER TABLE "new_Patient" RENAME TO "Patient";
CREATE UNIQUE INDEX "Patient_dni_key" ON "Patient"("dni");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PatientNote_patientId_idx" ON "PatientNote"("patientId");
