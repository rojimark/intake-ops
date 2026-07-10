/*
  Warnings:

  - You are about to drop the column `scopeAssesment` on the `OperationsRecord` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OperationsRecord" DROP COLUMN "scopeAssesment",
ADD COLUMN     "scopeAssessment" TEXT;
