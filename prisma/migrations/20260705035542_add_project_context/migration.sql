-- AlterTable
ALTER TABLE "FeedbackEvent" ADD COLUMN     "projectContextId" TEXT;

-- CreateTable
CREATE TABLE "ProjectContext" (
    "id" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "approvedScope" TEXT NOT NULL,
    "outOfScope" TEXT,
    "constraints" TEXT,
    "deadline" TIMESTAMP(3),
    "budgetNotes" TEXT,
    "communicationTone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContext_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeedbackEvent" ADD CONSTRAINT "FeedbackEvent_projectContextId_fkey" FOREIGN KEY ("projectContextId") REFERENCES "ProjectContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;
