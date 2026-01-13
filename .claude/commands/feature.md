---
description: Enter feature implementation mode
argument-hint: [feature description]
---
## Feature Implementation Mode

We're focusing on **implementing a feature** using our established workflow.

Feature: $ARGUMENTS

### Context

- Current branch: !`git branch --show-current`
- Git status: !`git status --short`
- Open issues: !`glab issue list --per-page=5 2>/dev/null || gh issue list --limit 5 2>/dev/null || echo "No issue CLI available"`

### Our workflow

Following the project conventions in @CLAUDE.md:

1. **Issue First** - Do we have an issue for this? If not, I'll suggest creating one.
2. **Feature Branch** - Create branch with `just branch-create <issue> <name>`
3. **Implementation** - Incremental changes with your feedback
4. **Quality Checks** - Run `just lint` and `just test`
5. **Completion** - Create MR with `just mr-create`

### Questions before we start

1. Is there an existing issue for this feature?
2. Any specific requirements or constraints I should know about?
3. Are there related files or patterns I should follow?

Let's begin!
