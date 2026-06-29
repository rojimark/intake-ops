import { NextResponse } from "next/server";
import {
  updateFeedbackEventStatus,
  getFeedbackEventById
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

    const selectedEvent = await getFeedbackEventById(eventId);

    if (!selectedEvent) {
      return NextResponse.json(
        { error: "Feedback event not found." },
        { status: 404 }
      );
    }

    if (selectedEvent.status !== "review_required") {
      return NextResponse.json(
        { error: "Only review-required events can be completed." },
        { status: 409 }
      );
    }

    const completedEvent = await updateFeedbackEventStatus(eventId, "completed");
    if (!completedEvent) {
      return NextResponse.json(
        { error: "Event cannot transition to completed." },
        { status: 409 }
      );

    }


    return NextResponse.json(
      {
        ok: true,
        event: completedEvent,
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
