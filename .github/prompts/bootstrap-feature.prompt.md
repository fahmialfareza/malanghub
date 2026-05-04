---
name: "Bootstrap Feature"
description: "Create or refine a feature workflow, identify the owning code path, and start the first implementation slice"
argument-hint: "Describe the feature, affected app, and any constraints"
agent: "agent"
---

Bootstrap the requested feature in a controlled way.

- Read `AGENT_CONTEXT.md` first.
- Create or update a matching feature task spec under `.github/tasks/features/` when one does not already exist.
- Identify the smallest owning code path or abstraction that controls the requested behavior.
- Start with the first useful implementation slice instead of broad rewrites.
- Keep the checklist current as you complete items.
- Validate the touched area with the narrowest useful check.
- Summarize affected apps, assumptions, and the validation you ran.
