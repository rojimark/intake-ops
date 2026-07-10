import { z } from "zod";

export const FeedbackEventSchema = z.object({
  id: z.string(),
  source: z.enum(["email", "form", "manual"]),
  receivedAt: z.iso.datetime(),
  status: z.enum(["new", "processing", "review_required", "completed", "failed"]),
  message: z.string(),
  projectContextId: z.string().nullable().optional(),
});

export const RiskTypeSchema = z.enum([
  "deadline_risk",
  "budget_concern",
  "scope_creep",
  "blocked_work",
  "unclear_request",
  "stakeholder_conflict",
  "dependency_risk",
]);

export const ScopeAssessmentSchema = z.enum([
  "within_scope",
  "possible_scope_change",
  "out_of_scope",
  "unclear",
])

export const OperationsRecordSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  summary: z.string(),
  sentiment: z.enum(["positive", "negative", "neutral"]),
  priority: z.enum(["high", "medium", "low"]),
  needsResponse: z.boolean(),
  actionItems: z.array(z.string()),
  risks: z.array(RiskTypeSchema),
  suggestedResponse: z.string(),
  confidence: z.enum(["low", "medium", "high"]),

  contextVersion: z.string().nullable().optional(),
  scopeAssessment: ScopeAssessmentSchema.nullable().optional(),
  evidence: z.array(z.string().nullable().optional()),
  assumptions: z.array(z.string().nullable().optional()),
  missingInformation: z.array(z.string().nullable().optional()),
  humanReviewReason: z.string().nullable().optional,

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime().nullable().optional(),
});

export const OperationsAnalysisSchema = OperationsRecordSchema.omit({
  id: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  contextVersion: true,
});

export const ProjectContextSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  clientName: z.string(),

  approvedScope: z.string(),
  outOfScope: z.string().nullable().optional(),
  constraints: z.string().nullable().optional(),
  deadline: z.iso.datetime().nullable().optional(),
  budgetNotes: z.string().nullable().optional(),
  communicationTone: z.string().nullable().optional(),

  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const OperationsContextPackageSchema = z.object({
  contextVersion: z.literal("operations_context_v1"),

  event: z.object({
    id: z.string(),
    source: z.enum(["email", "form", "manual"]),
    receivedAt: z.iso.datetime(),
    message: z.string(),
  }),

  projectContext: ProjectContextSchema.nullable(),

  recentOperationsRecords: z.array(
    z.object({
      id: z.string(),
      eventId: z.string(),
      summary: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      risks: z.array(RiskTypeSchema),
      createdAt: z.iso.datetime(),
    })
  ),

  metadata: z.object({
    builtAt: z.iso.datetime(),
    recentOperationsRecordsLimit: z.number(),
    includedProjectContext: z.boolean(),
  }),
});

export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type OperationsAnalysis = z.infer<typeof OperationsAnalysisSchema>;
export type FeedbackEvent = z.infer<typeof FeedbackEventSchema>;
export type OperationsRecord = z.infer<typeof OperationsRecordSchema>;
export type RiskType = z.infer<typeof RiskTypeSchema>;
export type ScopeAssessment = z.infer<typeof ScopeAssessmentSchema>;
export type OperationsContextPackage = z.infer<typeof OperationsContextPackageSchema>;
