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
  createdAt: z.iso.datetime(),
});

export const OperationsAnalysisSchema = OperationsRecordSchema.omit({
  id: true,
  eventId: true,
  createdAt: true,
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

export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type OperationsAnalysis = z.infer<typeof OperationsAnalysisSchema>;
export type FeedbackEvent = z.infer<typeof FeedbackEventSchema>;
export type OperationsRecord = z.infer<typeof OperationsRecordSchema>;
export type RiskType = z.infer<typeof RiskTypeSchema>;
