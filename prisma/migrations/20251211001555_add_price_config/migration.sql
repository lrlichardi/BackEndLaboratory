/*
  Warnings:

  - You are about to alter the column `factor` on the `PriceConfig` table. The data in that column could be lost. The data in that column will be cast from `Decimal` to `Int`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PriceConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "factor" INTEGER NOT NULL
);
INSERT INTO "new_PriceConfig" ("factor", "id") SELECT "factor", "id" FROM "PriceConfig";
DROP TABLE "PriceConfig";
ALTER TABLE "new_PriceConfig" RENAME TO "PriceConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
