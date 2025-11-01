/*
  Warnings:

  - You are about to alter the column `codigo` on the `Nomenclador` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Nomenclador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" INTEGER NOT NULL,
    "determinacion" TEXT NOT NULL,
    "ub" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Nomenclador" ("codigo", "createdAt", "determinacion", "id", "ub", "updatedAt") SELECT "codigo", "createdAt", "determinacion", "id", "ub", "updatedAt" FROM "Nomenclador";
DROP TABLE "Nomenclador";
ALTER TABLE "new_Nomenclador" RENAME TO "Nomenclador";
CREATE UNIQUE INDEX "Nomenclador_codigo_key" ON "Nomenclador"("codigo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
