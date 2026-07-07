import { NextResponse } from "next/server";
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
            )
        }

        const operationContext = await buildOperationsContext(eventId);

        return NextResponse.json(
            {
                context: operationContext,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error("Failed to build operations context:", error);

        return NextResponse.json(
            {
                error: "Failed to buuild operations context,"
            },
            { status: 500 }
        )
    }
}