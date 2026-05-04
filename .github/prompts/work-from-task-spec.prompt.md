---
name: "Work From Task Spec"
description: "Implement work from a .github/tasks specification and keep its checklist current"
argument-hint: "Point to a task file and state any extra constraints"
agent: "agent"
---

Implement the requested work from the provided task specification.

- Read `AGENT_CONTEXT.md` before planning.
- Load any relevant `.github/instructions/*.instructions.md` files for the paths you touch.
- Work through the checklist item by item.
- Keep edits minimal and aligned with existing local patterns.
- Validate the touched area with the narrowest useful check.
- Update the task checklist as each item is completed.
- Summarize affected apps and the validation you ran.
