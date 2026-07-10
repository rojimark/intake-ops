import { prisma } from "@/lib/prisma";
import { type OperationsRecord, type RiskType } from "@/lib/schema";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function toRiskArray(value: unknown): RiskType[] {
  return toStringArray(value).filter((risk): risk is RiskType =>
    [
      "deadline_risk",
      "budget_concern",
      "scope_creep",
      "blocked_work",
      "unclear_request",
      "stakeholder_conflict",
      "dependency_risk",
    ].includes(risk)
  );
}

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

  contextVersion: string | null;
  scopeAssessment: string | null;
  evidence: unknown;
  assumptions: unknown;
  missingInformation: unknown;
  humanReviewReason: unknown;

  createdAt: Date;
  updatedAt: Date;
}): OperationsRecord {
  return {
    id: record.id,
    eventId: record.eventId,
    summary: record.summary,
    sentiment: record.sentiment as OperationsRecord["sentiment"],
    priority: record.priority as OperationsRecord["priority"],
    needsResponse: record.needsResponse,
    actionItems: toStringArray(record.actionItems),
    risks: toRiskArray(record.risks),
    suggestedResponse: record.suggestedResponse,
    confidence: record.confidence as OperationsRecord["confidence"],

    contextVersion: record.contextVersion,
    scopeAssessment:
      record.scopeAssessment as OperationsRecord["scopeAssessment"],
    evidence: toStringArray(record.evidence),
    assumptions: toStringArray(record.assumptions),
    missingInformation: toStringArray(record.missingInformation),
    humanReviewReason: record.humanReviewReason,

    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function addOperationsRecord(
  record: OperationsRecord
): Promise<OperationsRecord> {
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

      contextVersion: record.contextVersion ?? null,
      scopeAssessment: record.scopeAssessment ?? null,
      evidence: toStringArray(record.evidence),
      assumptions: toStringArray(record.assumptions),
      missingInformation: toStringArray(record.missingInformation),
      humanReviewReason: toNullableString(record.humanReviewReason),
    },
  });

  return toOperationsRecord(createdRecord);
}

export async function getOperationsRecords(): Promise<OperationsRecord[]> {
  const records = await prisma.operationsRecord.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return records.map(toOperationsRecord);
}

export async function getOperationsRecordByEventId(
  eventId: string
): Promise<OperationsRecord | null> {
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

function toNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}