import { NextResponse } from "next/server";
import {
  updateFeedbackEventStatus,
  getFeedbackEventById,
} from "@/lib/feedback-event-store";
import { addOperationsRecord } from "@/lib/operations-record-store";
import { type OperationsRecord } from "@/lib/schema";
import { buildOperationsContext } from "@/lib/context/build-operations-context";
import { processFeedbackWithContext } from "@/lib/ai/process-feedback-with-context";

interface Context {
  params: Promise<{ eventId: string }>;
}

export async function POST(_request: Request, context: Context) {
  try {
    const { eventId } = await context.params;

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

      const operationsContext = await buildOperationsContext(eventId);
      const analysis = await processFeedbackWithContext(operationsContext);
      const now = new Date().toISOString();

      const operationsRecord: OperationsRecord = {
        id: crypto.randomUUID(),
        eventId,
        ...analysis,
        contextVersion: operationsContext.contextVersion,
        createdAt: now,
        updatedAt: now,
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