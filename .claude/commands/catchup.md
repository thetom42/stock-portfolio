---
description: Session continuity - review recent activity and restore context
allowed-tools: Bash(just catchup:*)
---
## Catching Up

Let me gather the recent project activity to restore context.

### Project Activity

!`just catchup 2>/dev/null || echo "just catchup not available - gathering info manually"`

### Additional Context

- Current branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Last session's work: !`git log --oneline -3 --no-merges 2>/dev/null`

### Project conventions

@CLAUDE.md

### Session Restoration

Based on this information, I can help you:

1. **Continue where you left off** - Pick up an in-progress task
2. **Review recent changes** - Understand what was done recently
3. **Start fresh** - Begin a new task with full context
4. **Check status** - See what needs attention (open issues, failing tests)

What would you like to focus on?
