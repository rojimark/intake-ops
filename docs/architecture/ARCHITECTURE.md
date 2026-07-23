# IntakeOps Architecture

## System Overview

```text
Client Feedback
      ↓
Event Ingestion
      ↓
Validation
      ↓
Persistence
      ↓
Context Builder
      ↓
Prepared Context Package
      ↓
AI Processor
      ↓
Structured Output Validation
      ↓
Operations Record Persistence
      ↓
Operational Review
      ↓
Human Approval


Core Components

Event Ingestion

Accepts feedback from supported sources and creates a validated FeedbackEvent.

Workflow State Management

Tracks:

* new
* processing
* review_required
* completed
* failed

Context Builder

Assembles:

* current feedback
* project scope
* constraints
* recent history
* context metadata

The context builder is separate from the AI processor.

AI Processor

Receives a prepared context package and returns validated structured operational output.

Persistence Layer

Prisma and PostgreSQL persist:

* feedback events
* operations records
* project context
* workflow state

Human Review

Potential scope changes, uncertainty, missing information, and operational risks require human review.

Data Flow

Describe the request lifecycle from event creation to completion.

Failure Flow
processing
    ↓
AI or validation failure
    ↓
failed
    ↓
retry
    ↓
processing

Current Boundaries

IntakeOps does not currently:

* send emails
* create external tasks
* use MCP
* execute irreversible actions
* support multi-tenancy

Keep this synchronized with the actual code.

---

## `DECISIONS.md`

Purpose: record major architecture decisions and why they were made.

Use a lightweight ADR format:

```md
# Architecture Decisions

## ADR-001 — Use PostgreSQL Instead of SQLite

### Status

Accepted

### Context

IntakeOps evolved from a learning exercise into a flagship portfolio application requiring durable workflow state.

### Decision

Use Prisma with PostgreSQL.

### Consequences

Benefits:

- production-like relational database
- durable workflow history
- stronger future support for analytics and evaluations

Costs:

- more local setup
- migrations must be managed

---

## ADR-002 — Separate Context Assembly From AI Processing

### Status

Accepted

### Context

The AI processor previously risked becoming responsible for fetching project scope, constraints, and history.

### Decision

Create a dedicated context builder that produces a prepared context package.

### Consequences

- easier testing
- clearer responsibilities
- improved traceability
- easier future replacement of context sources

---

## ADR-003 — Use Long Context for Current Project Context

### Status

Accepted

### Context

Current context is bounded to one project, its scope, constraints, and limited recent history.

### Decision

Pass the assembled project context directly to the model instead of introducing vector retrieval.

### Revisit When

- project history becomes too large
- multiple document collections are introduced
- context cost or latency becomes excessive

