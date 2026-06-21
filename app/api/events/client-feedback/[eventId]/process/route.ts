import { NextResponse } from "next/server";
import {
  getFeedbackEvents,
  updateFeedbackEventStatus,
} from "@/lib/feedback-event-store";

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

    const events = getFeedbackEvents();
    const selectedEvent = events.find((event) => event.id === eventId);

    if (!selectedEvent) {
      return NextResponse.json(
        { error: "Feedback event not found." },
        { status: 404 }
      );
    }

    if (selectedEvent.status === "completed") {
      return NextResponse.json(
        { error: "Completed events cannot be processed again." },
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
