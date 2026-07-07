-- AlterTable
ALTER TABLE "OperationsRecord" ADD COLUMN     "assumptions" JSONB,
ADD COLUMN     "contextVersion" TEXT,
ADD COLUMN     "evidence" JSONB,
ADD COLUMN     "humanReviewReason" TEXT,
ADD COLUMN     "missingInformation" JSONB,
ADD COLUMN     "scopeAssesment" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
