# Week 7 — Context Engineering Regression Scenarios

## Purpose

This document records the regression scenarios used to evaluate the context-aware processing pipeline in IntakeOps.

These scenarios verify that the system correctly uses:

* Current client feedback
* Approved project scope
* Explicit out-of-scope items
* Project constraints
* Deadline and budget notes
* Completed, human-reviewed operations history

The purpose of these tests is to detect regressions after changes to:

* Prompts
* Context assembly
* Models
* Structured output schemas
* Risk classification rules

---

## Evaluation Criteria

Each scenario should be reviewed against the following criteria:

1. **Scope classification**

   * Does the result correctly classify the request as within scope, possible scope change, out of scope, or unclear?

2. **Risk classification**

   * Are the relevant operational risks present?
   * Are unsupported risks excluded?

3. **Evidence grounding**

   * Does the evidence reference facts from the current feedback and project context?
   * Does the evidence avoid contradicting approved scope?

4. **Human review consistency**

   * Is `humanReviewReason` populated when the request requires review?
   * Is it `null` when no additional review is necessary?

5. **Response safety**

   * Does the suggested response avoid promising unapproved or unverified work?
   * Does it follow the configured communication tone?

6. **Missing information**

   * Does the model identify information required to proceed safely?
   * Does it avoid inventing missing details?

---

# Scenario 1 — Clearly Within Scope

## Input

```text
Can we make the CTA button larger and update the hero copy?
```

## Relevant Project Context

Approved scope includes:

* Hero copy adjustments
* CTA styling

## Expected Result

```yaml
scopeAssessment: within_scope
priority: medium
needsResponse: true
humanReviewReason: null
```

The risks array should not contain:

```yaml
- scope_creep
- deadline_risk
- budget_concern
```

## Expected Evidence

Evidence should identify that:

* Enlarging the CTA button aligns with CTA styling.
* Updating the hero copy aligns with hero copy adjustments.

## Result

```yaml
status: pass
```

## Notes

An earlier version incorrectly returned `possible_scope_change` because recent AI-generated history influenced the current classification.

The context builder was updated so only completed, human-reviewed operations records are included in recent history.

---

# Scenario 2 — Explicitly Out of Scope

## Input

```text
Can we add CSV exports, reporting dashboards, and team permissions before Friday?
```

## Relevant Project Context

Explicitly out-of-scope items include:

* CSV exports
* Reporting dashboards
* Team permissions

The project budget is fixed for Phase 1.

## Expected Result

```yaml
scopeAssessment: out_of_scope
priority: high
needsResponse: true
humanReviewReason: populated
```

Required risk:

```yaml
- scope_creep
```

Additional expected risks when correctly considering all context:

```yaml
- deadline_risk
- budget_concern
```

## Expected Evidence

Evidence should identify that:

* All three requested features are explicitly out of scope.
* The request introduces a compressed delivery window.
* Additional work conflicts with the fixed project budget.

## Result

```yaml
status: partial_pass
```

## Notes

The core scope classification passed.

The tested output correctly returned:

```yaml
scopeAssessment: out_of_scope
risks:
  - scope_creep
```

However, the model did not include `deadline_risk` or `budget_concern`.

This is currently treated as a secondary risk-completeness issue rather than a failure of the main scope assessment.

---

# Scenario 3 — Out of Scope with Deadline Risk

## Input

```text
Can we add payment integration and still launch tomorrow?
```

## Relevant Project Context

Payment integration is explicitly listed as out of scope.

The requested launch deadline is compressed.

## Expected Result

```yaml
scopeAssessment: out_of_scope
priority: high
needsResponse: true
humanReviewReason: populated
```

Required risks:

```yaml
- scope_creep
- deadline_risk
```

## Expected Evidence

Evidence should identify that:

* Payment integration is explicitly out of scope.
* The request asks for delivery by tomorrow.
* The requested work cannot be safely committed to without review.

## Result

```yaml
status: pass
```

---

# Scenario 4 — Ambiguous Request

## Input

```text
Can we make it better before launch?
```

## Relevant Project Context

The request does not identify:

* Which part of the product should be improved
* What “better” means
* What success criteria should be used

## Expected Result

```yaml
scopeAssessment: unclear
needsResponse: true
humanReviewReason: populated
```

Required risk:

```yaml
- unclear_request
```

`missingInformation` must be populated.

## Expected Missing Information

The model should request clarification about:

* Which page, feature, or workflow should be improved
* What problem the client is currently experiencing
* What outcome the client expects
* Whether the request affects the existing launch plan

## Result

```yaml
status: pass
```

---

# Scenario 5 — Mixed Within-Scope and Possible Scope-Change Request

## Input

```text
I love how fresh the new design looks, but there are a few parts that feel a bit cluttered and some of the text blocks seem to blend together too much. When I opened it on my iPad, a couple of the pictures looked kind of stretched out, and the main menu at the top keeps disappearing or jumping around when I try to scroll down. We also noticed that it takes quite a few clicks to actually get to our services page, so we want to make sure customers don't get lost trying to find what we offer. Can you guys just tweak the layout to make everything pop a bit more and make it easier to navigate around the site?
```

## Relevant Project Context

Approved scope includes:

* Homepage layout updates
* Basic responsive fixes
* Content polish for existing pages

Potential scope-change area:

* Navigation restructuring
* Changes to information architecture
* New navigation behavior beyond minor usability fixes

## Expected Result

```yaml
scopeAssessment: possible_scope_change
priority: medium
needsResponse: true
humanReviewReason: populated
```

Expected risks may include:

```yaml
- scope_creep
- deadline_risk
```

## Expected Evidence

Evidence should distinguish between the different parts of the request.

Within-scope items:

* iPad image stretching
* Layout readability
* Text blocks blending together
* Existing menu stability defects

Possible scope-change item:

* Reducing the number of clicks required to reach the services page if this requires navigation restructuring

## Result

```yaml
status: pass_with_warning
```

## Notes

The model correctly returned `possible_scope_change`.

However, one evidence statement incorrectly suggested that cluttered layout concerns were outside the approved scope.

This is an evidence-quality issue. The overall classification was acceptable because the navigation request may require structural changes.

---

# Context History Regression

## Risk

Passing unreviewed AI-generated operations records into future prompts created a self-reinforcing feedback loop.

Example:

```text
Previous AI record:
scope_creep

New request:
CTA styling and hero copy update

Incorrect result:
possible_scope_change
```

## Cause

Recent AI-generated risks and priorities were treated as authoritative project history.

## Fix

Only operations records whose related event status is `completed` are included in recent history.

```ts
event: {
  projectContextId: event.projectContextId,
  status: "completed",
}
```

The current event is also excluded:

```ts
eventId: {
  not: eventId,
}
```

## Trust Hierarchy

The model should treat context in this order:

1. Current feedback event
2. Approved project scope
3. Explicit out-of-scope items
4. Project constraints
5. Deadline and budget notes
6. Completed, human-reviewed operations history

Recent history is advisory and must not override approved project context.

---

# Known Model Limitations

The current model may occasionally:

* Treat approved layout work as potential scope creep
* Miss secondary risks such as budget concern
* Produce evidence that is broader than the actual source context
* Overestimate the need for human review
* Use cautious language even when a request is clearly within scope

These issues should be tracked before making further prompt changes.

The prompt should not be expanded for every individual imperfect response.

Changes should be based on repeated failures across the regression set.

---

# Regression Test Process

After modifying the prompt, model, context builder, or schema:

1. Create a new feedback event for each scenario.
2. Process each event through the standard workflow.
3. Record the actual output.
4. Compare the result against the expected minimum behavior.
5. Check for regressions in previously passing scenarios.
6. Avoid modifying the prompt based on one isolated output.
7. Compare models using the same scenarios when evaluating model quality.

---

# Current Status

| Scenario                        | Status            |
| ------------------------------- | ----------------- |
| Clearly within scope            | Pass              |
| Explicitly out of scope         | Partial pass      |
| Out of scope with deadline risk | Pass              |
| Ambiguous request               | Pass              |
| Mixed scope request             | Pass with warning |
| Completed-history isolation     | Pass              |

---

# Week 7 Regression Verdict

The IntakeOps context-aware processing pipeline currently satisfies the core Week 7 requirements:

* It compares feedback against approved project scope.
* It identifies explicit out-of-scope requests.
* It detects ambiguous requests.
* It detects scope and deadline risks.
* It provides grounded evidence and missing-information questions.
* It stores context metadata.
* It exposes the analysis and source context in the UI.
* It limits recent history to completed, human-reviewed records.

The main remaining limitation is output-quality variance from the current model, especially around evidence wording and secondary risk completeness.
