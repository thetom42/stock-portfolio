---
description: Session continuity - review recent activity and restore context
allowed-tools: Bash(just catchup:*)
---
## Catching Up

Let me gather the recent project activity to restore context.

Follow the shared cross-harness catchup workflow in
@.ai-harness/workflows/catchup.md when present. Treat repository artifacts,
session notes, and deterministic commands as the source of truth; do not assume
the previous handoff came from Claude Code.

### Project Activity

!`just catchup 2>/dev/null || echo "just catchup not available - gathering info manually"`

### Session Restoration

Based on this information, I can help you:

1. **Continue where you left off** - Pick up an in-progress task
2. **Review recent changes** - Understand what was done recently
3. **Start fresh** - Begin a new task with full context
4. **Check status** - See what needs attention (open issues, failing tests)

What would you like to focus on?
