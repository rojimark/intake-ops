# IntakeOps Engineering Principles

## 1. Validate at System Boundaries

Validate incoming events before persistence and validate AI output before business use.

## 2. AI Receives Prepared Context

The AI processor must not independently discover or fetch arbitrary context.

## 3. Persist Workflow State

Operational state must survive process and server restarts.

## 4. Prefer Explicit Workflows Over Hidden Autonomy

State transitions and actions should be observable and understandable.

## 5. Human Review Before Consequential Actions

Uncertainty, scope changes, risks, and irreversible actions require human approval.

## 6. Prefer the Simplest Context Strategy

Use direct context for bounded data. Add retrieval only when scale, relevance, permissions, or cost justify it.

## 7. Separate Retrieval From Generation

Retrieval failures and generation failures must be independently diagnosable.

## 8. Never Trust Raw Model Output

All operational AI output must conform to a validated schema.

## 9. Preserve Evidence and Uncertainty

The system should expose evidence, assumptions, missing information, confidence, and review reasons.

## 10. Frameworks Are Replaceable

Architecture should depend on stable concepts rather than unnecessary framework abstractions.

## 11. Business Outcomes Drive Architecture

AI techniques are implementation details. The workflow and operational outcome come first.

## 12. Every Major Change Updates Documentation

Changes to system boundaries, data flow, context strategy, or operational behavior must update the relevant living document.