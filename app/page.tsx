"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

type OperationsDashboard = {
  totalEvents: number;
  newItems: number;
  inReview: number;
  completed: number;
  failed: number;
  highPriority: number;
  needsResponse: number;
  deadlineRisks: number;
  scopeCreepRisks: number;
  blockedWork: number;
};

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [dashboard, setDashboard] = useState<OperationsDashboard | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/operations/dashboard", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch operations dashboard.");
      }

      const data = await response.json();
      setDashboard(data.dashboard);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <main className="min-h-screen bg-zinc-50 p-6 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              IntakeOps Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Overview of client feedback, workflow status, and operational risk.
            </p>
          </div>

          <Link
            href="/inbox"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Open Inbox
          </Link>
        </header>

        {!dashboard ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Loading dashboard…
          </div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Workflow Status
              </h2>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <MetricCard label="Total Events" value={dashboard.totalEvents} />
                <MetricCard label="New Items" value={dashboard.newItems} />
                <MetricCard label="In Review" value={dashboard.inReview} />
                <MetricCard label="Completed" value={dashboard.completed} />
                <MetricCard label="Failed" value={dashboard.failed} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Operational Signals
              </h2>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <MetricCard label="High Priority" value={dashboard.highPriority} />
                <MetricCard label="Needs Response" value={dashboard.needsResponse} />
                <MetricCard label="Deadline Risks" value={dashboard.deadlineRisks} />
                <MetricCard label="Scope Creep" value={dashboard.scopeCreepRisks} />
                <MetricCard label="Blocked Work" value={dashboard.blockedWork} />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}