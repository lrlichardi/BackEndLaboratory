/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `TestOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TestOrder" ADD COLUMN "orderNumber" TEXT;
ALTER TABLE "TestOrder" ADD COLUMN "title" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TestOrder_orderNumber_key" ON "TestOrder"("orderNumber");
