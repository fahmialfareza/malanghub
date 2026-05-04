---
name: "Refactor Scope"
description: "Refactor a specific area with minimal behavioral change and scoped validation"
argument-hint: "Describe the files or behavior to refactor"
agent: "agent"
---

Refactor the requested scope while preserving behavior.

- Read `AGENT_CONTEXT.md` before planning.
- Load the relevant `.github/instructions/*.instructions.md` files for the paths you touch.
- Identify the smallest useful refactor that improves structure, readability, or maintainability.
- Preserve existing behavior unless the user explicitly asks for a behavior change.
- Reuse existing local patterns before introducing new abstractions.
- Validate the touched area with the narrowest useful check.
- Summarize the structural change and the validation you ran.
