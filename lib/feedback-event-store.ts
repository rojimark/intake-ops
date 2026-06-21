import { FeedbackEvent } from "@/lib/schema";

const events: FeedbackEvent[] = [];

const allowedStatusTransitions: Record<
  FeedbackEvent["status"],
  FeedbackEvent["status"][]
> = {
  new: ["processing"],
  processing: ["review_required"],
  review_required: ["completed"],
  completed: [],
};

function canTransitionFeedbackEventStatus(
  currentStatus: FeedbackEvent["status"],
  nextStatus: FeedbackEvent["status"]
) {
  return allowedStatusTransitions[currentStatus].includes(nextStatus);
}

export function addFeedbackEvent(event: FeedbackEvent) {
  events.unshift(event);
  return event;
}

export function getFeedbackEvents() {
  return events;
}

export function getFeedbackEventById(eventId: string) {
  return events.find((event) => event.id === eventId) ?? null;
}

export function updateFeedbackEventStatus(
  eventId: string,
  status: FeedbackEvent["status"]
) {
  const event = getFeedbackEventById(eventId);

  if (!event) {
    return null;
  }
  if (!canTransitionFeedbackEventStatus(event.status, status)) {
    return null;
  }

  event.status = status;
  return event;
}