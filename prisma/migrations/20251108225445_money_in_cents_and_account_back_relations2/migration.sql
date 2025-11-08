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
    "method" TEXT DEFAULT 'N/A',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kind" TEXT,
    CONSTRAINT "ExamItemDef_examTypeId_fkey" FOREIGN KEY ("examTypeId") REFERENCES "ExamType" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ExamItemDef" ("createdAt", "examTypeId", "id", "key", "kind", "label", "method", "refText", "sortOrder", "unit", "updatedAt") SELECT "createdAt", "examTypeId", "id", "key", "kind", "label", "method", "refText", "sortOrder", "unit", "updatedAt" FROM "ExamItemDef";
DROP TABLE "ExamItemDef";
ALTER TABLE "new_ExamItemDef" RENAME TO "ExamItemDef";
CREATE UNIQUE INDEX "ExamItemDef_examTypeId_key_key" ON "ExamItemDef"("examTypeId", "key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
