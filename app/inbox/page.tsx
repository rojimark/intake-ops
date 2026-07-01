"use client";
import { useState, useEffect, useCallback } from "react";
import { FeedbackEvent, OperationsRecord } from "@/lib/schema";

type InboxFilter = "all" | FeedbackEvent["status"];

export default function Inbox() {
  const [events, setEvents] = useState<FeedbackEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FeedbackEvent | null>(null);
  const [selectedEventRecord, setSelectedEventRecord] = useState<OperationsRecord | null>(null);
  const [isRecordLoading, setIsRecordLoading] = useState(false);
  const [isProcessLoading, setIsProcessLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");


  const loadEvents = useCallback(async (selectedEventId?: string) => {
    try {
      const response = await fetch("/api/events/client-feedback", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feedback events.");
      }

      const data = await response.json();
      const eventList: FeedbackEvent[] = data.events || [];

      setEvents(eventList);

      setSelectedEvent((currentSelectedEvent) => {
        if (eventList.length === 0) {
          return null;
        }

        if (selectedEventId) {
          return (
            eventList.find((event) => event.id === selectedEventId) ??
            eventList[0]
          );
        }

        if (currentSelectedEvent) {
          return (
            eventList.find((event) => event.id === currentSelectedEvent.id) ??
            eventList[0]
          );
        }

        return eventList[0];
      });
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  }, []);

  async function getOperationsRecord(eventId: FeedbackEvent["id"]) {
    const response = await fetch(
      `/api/events/client-feedback/${eventId}/operations-record`,
      {
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch operations record.");
    }

    const data = await response.json();
    return data.record as OperationsRecord | null;
  }

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    async function loadSelectedEventRecord() {
      if (!selectedEvent) {
        setSelectedEventRecord(null);
        return;
      }

      if (
        selectedEvent.status !== "review_required" &&
        selectedEvent.status !== "completed"
      ) {
        setSelectedEventRecord(null);
        return;
      }

      try {
        setIsRecordLoading(true);

        const record = await getOperationsRecord(selectedEvent.id);
        setSelectedEventRecord(record);
      } catch (error) {
        console.error("Failed to fetch operations record:", error);
        setSelectedEventRecord(null);
      } finally {
        setIsRecordLoading(false);
      }
    }

    loadSelectedEventRecord();
  }, [selectedEvent]);

  const totalItems = events.length;
  const newItemsCount = events.filter(
    (event) => event.status === "new"
  ).length;
  const reviewRequiredCount = events.filter(
    (event) => event.status === "review_required"
  ).length;
  const completedCount = events.filter(
    (event) => event.status === "completed"
  ).length;
  const failedItemsCount = events.filter(
    (event) => event.status === "failed"
  ).length;
  const filteredEvents = activeFilter === "all" ?
    events : events.filter((event) => event.status === activeFilter);

  const handleProcessClick = async (
    id: string,
    currentStatus: FeedbackEvent["status"]
  ) => {
    if (!id || (currentStatus !== "new" && currentStatus !== "failed")) {
      return;
    }

    try {
      setIsProcessLoading(true);

      const response = await fetch(`/api/events/client-feedback/${id}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to process feedback event.");
      }

      await loadEvents(id);
    } catch (error) {
      console.error("Failed to process event:", error);
      await loadEvents(id);
    } finally {
      setIsProcessLoading(false);
    }
  };

  const handleCompleteClick = async (
    id: string,
    currentStatus: FeedbackEvent["status"]
  ) => {
    if (!id || currentStatus !== "review_required") {
      return;
    }

    try {
      const response = await fetch(`/api/events/client-feedback/${id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.error || "Failed to complete feedback event."
        );
      }

      await loadEvents(id);
    } catch (error) {
      console.error("Failed to complete event:", error);
    }
  };

  const handlePrimaryActionClick = async (event: FeedbackEvent) => {
    if (event.status === "new" || event.status === "failed") {
      await handleProcessClick(event.id, event.status);
      return;
    }

    if (event.status === "review_required") {
      await handleCompleteClick(event.id, event.status);
    }
  };

  function getPrimaryActionLabel(status: FeedbackEvent["status"]) {

    switch (status) {
      case "new":
        return "Process Event";
      case "processing":
        return "Processing…";
      case "review_required":
        return "Mark Completed";
      case "completed":
        return "Completed";
      case "failed":
        return "Retry Processing";
    }
  }


  return (
    <div className="flex h-screen w-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {/* Sidebar / Inbox List */}
      <aside className="flex w-full flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 sm:w-80 md:w-96">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Feedback Inbox</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {newItemsCount} new · {reviewRequiredCount} in review · {failedItemsCount} failed
            </p>
          </div>

          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {totalItems} total
          </span>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 p-3 dark:border-zinc-800">
          {[
            { label: "All", value: "all" },
            { label: "New", value: "new" },
            { label: "In Review", value: "review_required" },
            { label: "Failed", value: "failed" },
            { label: "Completed", value: "completed" },
          ].map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value as InboxFilter)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${activeFilter === filter.value
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {/* List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/50">
          {events.length === 0 ? (
            <div className="flex h-32 items-center justify-center p-4 text-sm text-zinc-500">
              No feedback messages found.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const isSelected = selectedEvent?.id === event.id;
              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className={`flex w-full flex-col gap-1 p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${isSelected ? "bg-zinc-100 dark:bg-zinc-800" : ""
                    }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {event.source}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(event.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h2 className="line-clamp-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {event.message}
                  </h2>
                  <p className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {event.message}
                  </p>
                  <div className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${event.status === "completed"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      }`}>
                      {event.status}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Reading Pane / Detail View */}
      <main className="hidden flex-1 flex-col bg-zinc-50 dark:bg-zinc-950 sm:flex">
        {selectedEvent ? (
          <div className="flex flex-col h-full">
            {/* Top Toolbar */}
            <div className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Status:
                </span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedEvent.status === "completed"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                  }`}>
                  {selectedEvent.status}
                </span>
              </div>
              <div className="text-xs text-zinc-400 dark:text-zinc-500">
                ID: {selectedEvent.id}
              </div>
            </div>

            {/* Message Body */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                {/* Meta Attributes Banner */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-6 dark:border-zinc-800">
                  <div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Origin Channel</span>
                    <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{selectedEvent.source}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Timestamp</span>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300">{new Date(selectedEvent.receivedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Content */}
                <div className="prose prose-zinc dark:prose-invert">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Message</h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {selectedEvent.message}
                  </p>
                </div>
                {/* Process Button */}
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => handlePrimaryActionClick(selectedEvent)}
                    disabled={selectedEvent.status !== "new" && selectedEvent.status !== "review_required" && selectedEvent.status !== "failed"}
                    className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:bg-zinc-100 dark:text-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500"
                  >
                    {getPrimaryActionLabel(selectedEvent.status)}
                  </button>
                </div>
                {/* operations Record Detail */}
                {selectedEvent.status === "new" && !isProcessLoading ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center pt-4">
                    Process this event to generate an operations record.
                  </p>
                ) : selectedEvent.status === "new" && isProcessLoading ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center pt-4">
                    Processing... Please wait...
                  </p>
                ) : selectedEvent.status === "processing" ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center pt-4">
                    Processing this event…
                  </p>
                ) : (
                  <div className="mt-6 border-t border-zinc-100 pt-6 dark:border-zinc-800">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Operations Record
                    </h3>

                    {isRecordLoading ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Loading operations record…
                      </p>
                    ) : selectedEventRecord ? (
                      <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                        <div>
                          <p className="text-xs text-zinc-400">Summary</p>
                          <p className="text-sm text-zinc-700 dark:text-zinc-300">
                            {selectedEventRecord.summary}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-zinc-400">Priority</p>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedEventRecord.priority}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-400">Needs Response</p>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedEventRecord.needsResponse ? "Yes" : "No"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-400">Sentiment</p>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedEventRecord.sentiment}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-zinc-400">Confidence</p>
                            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                              {selectedEventRecord.confidence}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-400">Action Items</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700 dark:text-zinc-300">
                            {selectedEventRecord.actionItems.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-400">Risks</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedEventRecord.risks.map((risk, index) => (
                              <span key={`${risk}-${index}`}>
                                {risk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-zinc-400">Suggested Response</p>
                          <p className="mt-2 whitespace-pre-wrap rounded-md bg-white p-3 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                            {selectedEventRecord.suggestedResponse}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No operations record yet. Process this event to generate one.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-4 text-zinc-400 dark:text-zinc-500">
            <svg className="h-12 w-12 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <p className="mt-2 text-sm">Select an item from the sidebar to view details</p>
          </div>
        )}
      </main>
    </div>
  );
}