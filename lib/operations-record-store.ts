import { prisma } from "@/lib/prisma";
import { type OperationsRecord, type RiskType } from "@/lib/schema";

function toOperationsRecord(record: {
  id: string;
  eventId: string;
  summary: string;
  sentiment: string;
  priority: string;
  needsResponse: boolean;
  actionItems: unknown;
  risks: unknown;
  suggestedResponse: string;
  confidence: string;
  createdAt: Date;
}): OperationsRecord {
  return {
    id: record.id,
    eventId: record.eventId,
    summary: record.summary,
    sentiment: record.sentiment as OperationsRecord["sentiment"],
    priority: record.priority as OperationsRecord["priority"],
    needsResponse: record.needsResponse,
    actionItems: Array.isArray(record.actionItems)
      ? record.actionItems.map(String)
      : [],
    risks: Array.isArray(record.risks)
      ? (record.risks as RiskType[])
      : [],
    suggestedResponse: record.suggestedResponse,
    confidence: record.confidence as OperationsRecord["confidence"],
    createdAt: record.createdAt.toISOString(),
  };
}

export async function addOperationsRecord(record: OperationsRecord) {
  const existingRecord = await getOperationsRecordByEventId(record.eventId);

  if (existingRecord) {
    return existingRecord;
  }

  const createdRecord = await prisma.operationsRecord.create({
    data: {
      id: record.id,
      eventId: record.eventId,
      summary: record.summary,
      sentiment: record.sentiment,
      priority: record.priority,
      needsResponse: record.needsResponse,
      actionItems: record.actionItems,
      risks: record.risks,
      suggestedResponse: record.suggestedResponse,
      confidence: record.confidence,
      createdAt: new Date(record.createdAt),
    },
  });

  return toOperationsRecord(createdRecord);
}

export async function getOperationsRecords() {
  const records = await prisma.operationsRecord.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map(toOperationsRecord);
}

export async function getOperationsRecordByEventId(eventId: string) {
  const record = await prisma.operationsRecord.findUnique({
    where: {
      eventId,
    },
  });

  if (!record) {
    return null;
  }

  return toOperationsRecord(record);
}