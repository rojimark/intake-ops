import { prisma } from "@/lib/prisma";
import {
  OperationsContextPackageSchema,
  type OperationsContextPackage,
  type RiskType,
} from "@/lib/schema";

const RECENT_OPERATIONS_RECORDS_LIMIT = 5;

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

export async function buildOperationsContext(
  eventId: string
): Promise<OperationsContextPackage> {
  const event = await prisma.feedbackEvent.findUnique({
    where: {
      id: eventId,
    },
    include: {
      projectContext: true,
    },
  });

  if (!event) {
    throw new Error(`Feedback event not found: ${eventId}`);
  }

  const recentOperationsRecords = event.projectContextId
    ? await prisma.operationsRecord.findMany({
      where: {
        eventId: {
          not: eventId,
        },
        event: {
          projectContextId: event.projectContextId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: RECENT_OPERATIONS_RECORDS_LIMIT,
    })
    : [];

  const contextPackage: OperationsContextPackage = {
    contextVersion: "operations_context_v1",

    event: {
      id: event.id,
      source: event.source as OperationsContextPackage["event"]["source"],
      receivedAt: event.receivedAt.toISOString(),
      message: event.message,
    },

    projectContext: event.projectContext
      ? {
        id: event.projectContext.id,
        projectName: event.projectContext.projectName,
        clientName: event.projectContext.clientName,
        approvedScope: event.projectContext.approvedScope,
        outOfScope: event.projectContext.outOfScope,
        constraints: event.projectContext.constraints,
        deadline: event.projectContext.deadline?.toISOString() ?? null,
        budgetNotes: event.projectContext.budgetNotes,
        communicationTone: event.projectContext.communicationTone,
        createdAt: event.projectContext.createdAt.toISOString(),
        updatedAt: event.projectContext.updatedAt.toISOString(),
      }
      : null,

    recentOperationsRecords: recentOperationsRecords.map((record) => ({
      id: record.id,
      eventId: record.eventId,
      summary: record.summary,
      priority: record.priority as "high" | "medium" | "low",
      risks: toRiskArray(record.risks),
      createdAt: record.createdAt.toISOString(),
    })),

    metadata: {
      builtAt: new Date().toISOString(),
      recentOperationsRecordsLimit: RECENT_OPERATIONS_RECORDS_LIMIT,
      includedProjectContext: Boolean(event.projectContext),
    },
  };

  return OperationsContextPackageSchema.parse(contextPackage);
}