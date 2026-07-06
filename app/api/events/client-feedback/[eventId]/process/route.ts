import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import {
  updateFeedbackEventStatus,
  getFeedbackEventById,
} from "@/lib/feedback-event-store";
import { addOperationsRecord } from "@/lib/operations-record-store";
import { type OperationsRecord, OperationsAnalysisSchema } from "@/lib/schema";

interface Context {
  params: Promise<{ eventId: string }>;
}

export async function POST(_request: Request, context: Context) {
  try {
    const { eventId } = await context.params;

    const MODEL = "gpt-4o-mini";
    const MAX_OUTPUT_TOKENS = 1200;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required." },
        { status: 400 }
      );
    }

    const selectedEvent = await getFeedbackEventById(eventId);

    if (!selectedEvent) {
      return NextResponse.json(
        { error: "Feedback event not found." },
        { status: 404 }
      );
    }

    if (selectedEvent.status !== "new" && selectedEvent.status !== "failed") {
      return NextResponse.json(
        { error: "Only new or failed events can be processed." },
        { status: 409 }
      );
    }

    const processingEvent = await updateFeedbackEventStatus(eventId, "processing");

    if (!processingEvent) {
      return NextResponse.json(
        { error: "Event cannot transition to processing." },
        { status: 409 }
      );
    }

    try {
      const client = getOpenAIClient();

      const response = await client.responses.create({
        model: MODEL,
        max_output_tokens: MAX_OUTPUT_TOKENS,
        input: [
          {
            role: "system",
            content: `Analyze incoming client communications and convert them into structured operational data.

Rules:
- Summaries should be concise and factual.
- Do not invent information.
- Sentiment should reflect the overall tone.
- Priority should reflect urgency, deadlines, business impact, and explicit requests.
- needsResponse should be true whenever the client asks a question, requests confirmation, requests work, raises a concern, or expects acknowledgement.
- Action items should be specific and actionable.
- If information is unclear, reflect that uncertainty rather than guessing.
- If none of the risk categories clearly apply, return an empty risks array. Do not force a risk classification.

Risk classification rules:
- deadline_risk: deadlines are compressed, threatened, or explicitly time-sensitive.
- scope_creep: new features, deliverables, or requirements are introduced.
- budget_concern: additional work is requested while budget remains fixed or constrained.
- unclear_request: request is ambiguous or success criteria are missing.
- stakeholder_conflict: stakeholders appear to disagree.
- dependency_risk: delivery depends on external teams, approvals, vendors, or blockers.
- blocked_work: work cannot proceed because required assets, approvals, access, or dependencies are missing.
- Classify missing required assets, access, files, approvals, or credentials as dependency_risk when they affect delivery.
- Classify work as blocked_work when the issue prevents or delays execution.

NeedsResponse rule:
- Set needsResponse to true when the client reports a problem, delay, missing asset, blocker, defect, or delivery issue, even if they do not ask a direct question.

A communication may contain multiple risk flags. Return all applicable risks.`,
          },
          {
            role: "user",
            content: processingEvent.message,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "operations_analysis",
            schema: OperationsAnalysisSchema.toJSONSchema(),
          },
        },
      });

      const parsedJson = JSON.parse(response.output_text);
      const analysis = OperationsAnalysisSchema.safeParse(parsedJson);

      if (!analysis.success) {
        await updateFeedbackEventStatus(eventId, "failed");

        return NextResponse.json(
          {
            error:
              "AI response did not match the expected operations analysis schema.",
            issues: analysis.error.flatten(),
          },
          { status: 422 }
        );
      }

      const operationsRecord: OperationsRecord = {
        id: crypto.randomUUID(),
        eventId,
        ...analysis.data,
        createdAt: new Date().toISOString(),
      };

      const createdOperationsRecord = await addOperationsRecord(operationsRecord);

      const reviewEvent = await updateFeedbackEventStatus(eventId, "review_required");

      if (!reviewEvent) {
        await updateFeedbackEventStatus(eventId, "failed");

        return NextResponse.json(
          { error: "Event cannot transition to review required." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          ok: true,
          event: reviewEvent,
           operationsRecord: createdOperationsRecord,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Failed to process event with AI:", error);

      await updateFeedbackEventStatus(eventId, "failed");

      return NextResponse.json(
        {
          error: "Failed to process event.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}