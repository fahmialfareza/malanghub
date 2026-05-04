---
name: "Create Task Spec"
description: "Create or update a feature, fix, or chore task specification in .github/tasks"
argument-hint: "Describe the work to capture in a task spec"
agent: "agent"
---

Create or update a task specification for the requested work.

- Read `AGENT_CONTEXT.md` first.
- Choose the correct task type: feature, fix, or chore.
- Use the matching template under `.github/tasks/`.
- Prefer updating an existing task file if one already covers the request.
- Keep the checklist concrete, small, and easy to validate.
- Mention affected apps, key constraints, and required validation steps.
- If the task needs configuration, list environment variables instead of hardcoding secrets.
