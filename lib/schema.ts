import { z } from "zod";

export const FeedbackEventSchema = z.object({
  id: z.string(),
  source: z.enum(["email", "form", "manual"]),
  receivedAt: z.iso.datetime(),
  status: z.enum(["new", "processing", "review_required", "completed", "failed"]),
  message: z.string(),
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

export type OperationsAnalysis = z.infer<typeof OperationsAnalysisSchema>;
export type FeedbackEvent = z.infer<typeof FeedbackEventSchema>;
export type OperationsRecord = z.infer<typeof OperationsRecordSchema>;
export type RiskType = z.infer<typeof RiskTypeSchema>;
