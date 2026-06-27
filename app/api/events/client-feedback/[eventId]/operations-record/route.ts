import { NextResponse } from "next/server";
import { getOperationsRecordByEventId } from "@/lib/operations-record-store";

interface Context {
  params: Promise<{ eventId: string }>;
}

export async function GET(_request: Request, context: Context) {
  try {
    const { eventId } = await context.params;

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required." },
        { status: 400 }
      );
    }

    const record = getOperationsRecordByEventId(eventId);

    if (!record) {
      return NextResponse.json(
        { record: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { record },
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