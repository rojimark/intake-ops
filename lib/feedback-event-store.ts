import { prisma } from "@/lib/prisma";
import { type FeedbackEvent } from "@/lib/schema";

const allowedStatusTransitions: Record<
  FeedbackEvent["status"],
  FeedbackEvent["status"][]
> = {
  new: ["processing"],
  processing: ["review_required", "failed"],
  review_required: ["completed"],
  completed: [],
  failed: ["processing"],
};

function canTransitionFeedbackEventStatus(
  currentStatus: FeedbackEvent["status"],
  nextStatus: FeedbackEvent["status"]
) {
  return allowedStatusTransitions[currentStatus].includes(nextStatus);
}

function toFeedbackEvent(record: {
  id: string;
  source: string;
  receivedAt: Date;
  status: string;
  message: string;
  projectContextId: string | null;
}): FeedbackEvent {
  return {
    id: record.id,
    source: record.source as FeedbackEvent["source"],
    receivedAt: record.receivedAt.toISOString(),
    status: record.status as FeedbackEvent["status"],
    message: record.message,
    projectContextId: record.projectContextId,
  };
}

export async function addFeedbackEvent(event: FeedbackEvent) {
  const createdEvent = await prisma.feedbackEvent.create({
    data: {
      id: event.id,
      source: event.source,
      receivedAt: new Date(event.receivedAt),
      status: event.status,
      message: event.message,
      projectContextId: event.projectContextId ?? null,
    },
  });

  return toFeedbackEvent(createdEvent);
}

export async function getFeedbackEvents() {
  const events = await prisma.feedbackEvent.findMany({
    orderBy: {
      receivedAt: "desc",
    },
  });

  return events.map(toFeedbackEvent);
}

export async function getFeedbackEventById(eventId: string) {
  const event = await prisma.feedbackEvent.findUnique({
    where: {
      id: eventId,
    },
  });

  if (!event) {
    return null;
  }

  return toFeedbackEvent(event);
}

export async function updateFeedbackEventStatus(
  eventId: string,
  status: FeedbackEvent["status"]
) {
  const currentEvent = await getFeedbackEventById(eventId);

  if (!currentEvent) {
    return null;
  }

  if (!canTransitionFeedbackEventStatus(currentEvent.status, status)) {
    return null;
  }

  const updatedEvent = await prisma.feedbackEvent.update({
    where: {
      id: eventId,
    },
    data: {
      status,
    },
  });

  return toFeedbackEvent(updatedEvent);
}