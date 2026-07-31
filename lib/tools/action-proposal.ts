import { z } from "zod";

export const actionProposalDraftSchema = z.object({
    toolName: z.string(),
    arguments: z.unknown(),
    rationale: z.string().trim().min(1),
});

export type ActionProposalDraft = z.infer<typeof actionProposalDraftSchema>;