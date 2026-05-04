---
name: "Review Changes"
description: "Review a scoped change with a bugs-first mindset and report findings before summary"
argument-hint: "Provide the files, task spec, PR diff, or feature area to review"
agent: "agent"
---

Review the requested change with a code review mindset.

- Read `AGENT_CONTEXT.md` first.
- If a task spec exists, read it before reviewing the implementation.
- Focus on correctness, regressions, risky assumptions, and missing validation.
- Prefer concrete findings with file references over broad commentary.
- Report findings first, ordered by severity.
- Keep any summary brief and mention residual risks or testing gaps.
- If no issues are found, say that explicitly.
