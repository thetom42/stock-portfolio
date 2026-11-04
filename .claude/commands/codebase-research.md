---
description: Deep asynchronous exploration of a codebase area with structured report
argument-hint: <area or topic to explore>
---
## Codebase Research: $ARGUMENTS

### Context

- Project overview: @CLAUDE.md
- Current branch: !`git branch --show-current`
- Recent activity in area: !`git log --oneline --all -- "*$ARGUMENTS*" 2>/dev/null | head -10 || echo "No direct file matches"`

### Research Objective

I'll independently explore **$ARGUMENTS** in this codebase and produce a structured report that the supervisor can read at their convenience.

### Report Structure

1. **Executive Summary** - What this area does in 2-3 sentences
2. **Architecture Overview** - Components, their responsibilities, and how they interact
3. **Data Flow** - How data moves through this area
4. **Dependencies** - What it depends on and what depends on it
5. **Code Quality Assessment** - Complexity, test coverage, documentation state
6. **Potential Issues** - Technical debt, fragile areas, missing error handling
7. **Improvement Opportunities** - Concrete suggestions ranked by impact/effort

### Output

The report will be saved to `docs/research/` (directory created if needed) as a markdown file for future reference. The filename will include the date and topic.

Let me start exploring the codebase.
