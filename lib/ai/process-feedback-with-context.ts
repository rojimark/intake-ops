import * as z from "zod";
import { getOpenAIClient } from "@/lib/openai";
import {
    OperationsAnalysisSchema,
    type OperationsAnalysis,
    type OperationsContextPackage,
} from "@/lib/schema";

const MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 1200;

export async function processFeedbackWithContext(
    context: OperationsContextPackage
): Promise<OperationsAnalysis> {
    const client = getOpenAIClient();

    const jsonSchema = z.toJSONSchema(OperationsAnalysisSchema);
    console.log(JSON.stringify(jsonSchema, null, 2));

    const response = await client.responses.create({
        model: MODEL,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        input: [
            {
                role: "system",
                content: `You are an AI operations analyst for a client services team.

Analyze the current client feedback using the provided project context. Do not analyze the feedback in isolation.

Source-of-truth priority:
1. Current feedback event
2. Approved project scope
3. Explicit out-of-scope items
4. Project constraints
5. Deadline and budget notes
6. Recent operations history

Scope assessment rules:
- within_scope: The request clearly fits the approved project scope.
- possible_scope_change: The request may introduce new work, deliverables, or requirements that need review.
- out_of_scope: The request clearly matches an explicit out-of-scope item.
- unclear: The request is too vague to assess safely.

General rules:
- Summaries must be concise and factual.
- Do not invent information.
- Action items must be specific and actionable.
- Evidence must cite facts from the supplied context.
- Assumptions must be explicit.
- Missing information must contain questions or facts needed before the team can proceed safely.
- Do not promise delivery when scope, deadline, budget, or feasibility requires review.
- Follow the project's communication tone when drafting the suggested response.
- humanReviewReason must explain why human review is needed, or be null when review is unnecessary.
- A feedback message may contain both within-scope work and possible scope changes. Evaluate the individual requested changes before assigning the overall scopeAssessment.
- Do not classify bug fixes, responsive fixes, or existing-page content polish as scope creep when they are explicitly covered by the approved scope.
- If scopeAssessment is possible_scope_change, out_of_scope, or unclear, humanReviewReason must not be null.
- If risks includes scope_creep, deadline_risk, or budget_concern, humanReviewReason must explain what requires human review.
- Suggested responses should distinguish work that appears covered by the approved scope from work that still requires feasibility or scope review.

Risk classification rules:
- deadline_risk: deadlines are compressed, threatened, or explicitly time-sensitive.
- scope_creep: new features, deliverables, or requirements are introduced.
- budget_concern: additional work is requested while budget remains fixed or constrained.
- unclear_request: the request is ambiguous or success criteria are missing.
- stakeholder_conflict: stakeholders appear to disagree.
- dependency_risk: delivery depends on external teams, approvals, vendors, assets, access, or blockers.
- blocked_work: work cannot proceed because required assets, approvals, access, or dependencies are missing.

A communication may contain multiple risk flags. Return every applicable risk. Return an empty risks array when no risk clearly applies.`,
            },
            {
                role: "user",
                content: buildContextPrompt(context),
            },
        ],
        text: {
            format: {
                type: "json_schema",
                name: "context_aware_operations_analysis",
                schema: jsonSchema,
            },
        },
    });

    const parsedJson: unknown = JSON.parse(response.output_text);
    const analysis = OperationsAnalysisSchema.safeParse(parsedJson);

    if (!analysis.success) {
        throw new Error(
            `AI response did not match the operations analysis schema: ${analysis.error.message}`
        );
    }

    return analysis.data;
}

function buildContextPrompt(context: OperationsContextPackage): string {
    const project = context.projectContext;

    const recentHistory =
        context.recentOperationsRecords.length > 0
            ? context.recentOperationsRecords
                .map(
                    (record, index) => `${index + 1}. ${record.summary}
Priority: ${record.priority}
Risks: ${record.risks.join(", ") || "none"}`
                )
                .join("\n\n")
            : "No recent operations records.";

    return `CURRENT FEEDBACK EVENT
Source: ${context.event.source}
Received at: ${context.event.receivedAt}
Message:
${context.event.message}

PROJECT
Project name: ${project?.projectName ?? "Not available"}
Client name: ${project?.clientName ?? "Not available"}

APPROVED SCOPE
${project?.approvedScope ?? "Not available"}

EXPLICITLY OUT-OF-SCOPE
${project?.outOfScope ?? "None documented"}

PROJECT CONSTRAINTS
${project?.constraints ?? "None documented"}

DEADLINE
${project?.deadline ?? "No deadline documented"}

BUDGET NOTES
${project?.budgetNotes ?? "No budget notes documented"}

COMMUNICATION TONE
${project?.communicationTone ?? "Professional and clear"}

RECENT OPERATIONS HISTORY
${recentHistory}

CONTEXT METADATA
Context version: ${context.contextVersion}
Project context included: ${context.metadata.includedProjectContext}`;
}