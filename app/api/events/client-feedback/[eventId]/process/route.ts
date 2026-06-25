import { NextResponse } from "next/server";
import { getOpenAIClient } from "@/lib/openai";
import {
  updateFeedbackEventStatus,
  getFeedbackEventById
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
    const openAiJsonSchema = OperationsAnalysisSchema.toJSONSchema();
    const client = getOpenAIClient();

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required." },
        { status: 400 }
      );
    }


    const selectedEvent = getFeedbackEventById(eventId);

    if (!selectedEvent) {
      return NextResponse.json(
        { error: "Feedback event not found." },
        { status: 404 }
      );
    }

    if (selectedEvent.status !== "new") {
      return NextResponse.json(
        { error: "Only new events can be processed." },
        { status: 409 }
      );
    }

    const processingEvent = updateFeedbackEventStatus(eventId, "processing");
    if (!processingEvent) {
      return NextResponse.json(
        { error: "Event cannot transition to processing." },
        { status: 409 }
      );

    }

    //TODO: call ai api
    console.log('Processing Event for AI: ', processingEvent)
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

Risk classification rules:

deadline_risk
- Requested work may threaten the timeline.
- Deadlines appear compressed.
- Significant work is requested near delivery dates.

scope_creep
- New features, deliverables, or requirements are introduced.
- Additional work expands the apparent project scope.

budget_concern
- Additional work is requested while budget remains fixed.
- Client indicates cost limitations despite increased scope.

unclear_requirements
- Requests are ambiguous.
- Success criteria are missing.

stakeholder_conflict
- Different stakeholders appear to disagree.

dependency_risk
- Delivery depends on external teams, approvals, vendors, or blockers.

A communication may contain multiple risk flags.
Return all applicable risks.
          `,
        },
        {
          role: "user",
          content: processingEvent.message,
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "operations_analysis",
          schema: openAiJsonSchema,
        }
      }
    });

    const rawText = response.output_text;
    const parsedJson = JSON.parse(rawText);
    const analysis = OperationsAnalysisSchema.safeParse(parsedJson);

    if (!analysis.success) {
      return NextResponse.json(
        {
          error: "AI response did not match the expected operations analysis schema.",
          issues: analysis.error.flatten(),
        },
        { status: 422 },
      );
    }
    const validatedAnalysis = analysis.data;
    console.log("Validated Analysis:", validatedAnalysis);

    const operationsRecord: OperationsRecord = {
      id: crypto.randomUUID(),
      eventId,
      ...analysis.data,
      createdAt: new Date().toISOString(),
    };

    addOperationsRecord(operationsRecord);

    const reviewEvent = updateFeedbackEventStatus(eventId, "review_required");
    if (!reviewEvent) {
      return NextResponse.json(
        { error: "Event cannot transition to review required." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        event: reviewEvent,
        operationsRecord
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
