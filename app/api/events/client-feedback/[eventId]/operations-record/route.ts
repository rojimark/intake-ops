import { NextResponse } from "next/server";
import { getOperationsRecordByEventId } from "@/lib/operations-record-store";
import { buildOperationsContext } from "@/lib/context/build-operations-context";

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

    const record = await getOperationsRecordByEventId(eventId);
    const operationsContext = record
      ? await buildOperationsContext(eventId)
      : null;

    if (!record) {
      return NextResponse.json(
        { record: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        record,
        context: operationsContext,
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