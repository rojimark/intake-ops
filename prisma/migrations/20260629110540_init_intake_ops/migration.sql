-- CreateTable
CREATE TABLE "FeedbackEvent" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "FeedbackEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationsRecord" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "needsResponse" BOOLEAN NOT NULL,
    "actionItems" JSONB NOT NULL,
    "risks" JSONB NOT NULL,
    "suggestedResponse" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationsRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationsRecord_eventId_key" ON "OperationsRecord"("eventId");

-- AddForeignKey
ALTER TABLE "OperationsRecord" ADD CONSTRAINT "OperationsRecord_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FeedbackEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
