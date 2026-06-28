import { NextResponse } from "next/server";
import { getFeedbackEvents } from "@/lib/feedback-event-store";
import { getOperationsRecords } from "@/lib/operations-record-store";

export async function GET(){
    const events = getFeedbackEvents();
    const records = getOperationsRecords();

    const dashboard = {
        totalEvents: events.length,

        newItems: events.filter((event) => event.status === "new").length,
        inReview: events.filter((event) => event.status === "review_required").length,
        completed: events.filter((event) => event.status === "completed").length,
        failed: events.filter((event) => event.status === "failed").length,

        highPriority: records.filter((record) => record.priority === "high").length,
        needsResponse: records.filter((record) => record.needsResponse).length,

        deadlineRisks: records.filter((record) => record.risks.includes("deadline_risk")).length,
        scopeCreepRisks: records.filter((record) => record.risks.includes("scope_creep")).length,
        blockedWork: records.filter((record) => record.risks.includes("blocked_work")).length,
    }

    return NextResponse.json({ dashboard }, { status: 200 });
}