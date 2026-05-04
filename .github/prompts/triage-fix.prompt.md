---
name: "Triage Fix"
description: "Triage a bug or regression, form a local hypothesis, and implement the smallest useful fix with focused validation"
argument-hint: "Describe the failing behavior, error, or affected files"
agent: "agent"
---

Triage and repair the requested issue.

- Read `AGENT_CONTEXT.md` first.
- Create or update a matching fix task spec under `.github/tasks/fixes/` when one does not already exist.
- Identify the controlling code path and form one falsifiable local hypothesis.
- Prefer the smallest root-cause fix over surface-level patches.
- Validate with the cheapest check that can falsify the hypothesis.
- Keep the fix checklist current as items are completed.
- Summarize the cause, fix, and validation you ran.
