import { type FeedbackEvent } from "@/lib/schema";
import { NextResponse } from "next/server";
import { z } from "zod";
import { addFeedbackEvent, getFeedbackEvents } from "@/lib/feedback-event-store";

const ClientFeedbackEventInputSchema = z.object({
  source: z.enum(["email", "form", "manual"]),
  message: z.string().trim().min(1, "Feedback message is required."),
});


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = ClientFeedbackEventInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid client feedback event.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { source, message } = parsed.data;

    const feedbackEvent: FeedbackEvent = {
      id: crypto.randomUUID(),
      source,
      receivedAt: new Date().toISOString(),
      status: "new",
      message,
    };

    addFeedbackEvent(feedbackEvent);

    return NextResponse.json(
      {
        event: feedbackEvent,
        message: "Feedback event received successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {events: getFeedbackEvents()},
    {status:200}
  );
}