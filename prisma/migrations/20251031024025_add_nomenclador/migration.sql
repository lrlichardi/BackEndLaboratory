-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "codigoAfiliado" TEXT;
ALTER TABLE "Patient" ADD COLUMN "obraSocial" TEXT;

-- CreateTable
CREATE TABLE "Nomenclador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "determinacion" TEXT NOT NULL,
    "ub" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Nomenclador_codigo_key" ON "Nomenclador"("codigo");
