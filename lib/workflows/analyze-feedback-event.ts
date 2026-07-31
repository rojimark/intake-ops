import { buildOperationsContext } from "../context/build-operations-context";
import { processFeedbackWithContext } from "../ai/process-feedback-with-context";
import { addOperationsRecord } from "../operations-record-store";
import type { OperationsRecord } from "../schema";

export async function analyzeFeedbackEvent(
    eventId: string
): Promise<OperationsRecord> {
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
    }
    return addOperationsRecord(operationsRecord);
}