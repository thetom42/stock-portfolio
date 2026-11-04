---
description: End-of-session handoff - summarize work and create session notes
allowed-tools: Bash(just session-note:*)
---
## Session Handoff

Let me help you document this session for future continuity.

Follow the shared cross-harness handoff workflow in
@.ai-harness/workflows/handoff.md when present. The handoff must be usable by
Claude Code, Codex, OpenCode, Antigravity, or PI Coding Agent in the same
working copy without access to this transcript.

### Session Summary

Based on our work today, here's what I'll capture:

**Source harness:**
- Claude Code

**What we worked on:**
- [List main tasks and changes]

**Repository state:**
- [Current branch, issue/MR, latest commits, push/MR state]

**Key decisions made:**
- [Document important choices and their rationale]

**Verification performed:**
- [Commands run and outcomes]

**Open threads:**
- [Note unfinished work or ideas to explore later]

**Local-only artifacts:**
- [Untracked files or local files to preserve]

**Recommended next steps:**
- [Suggest logical continuation points]

### Creating the Session Note

I'll use `just session-note` to record this. Here's the draft:

```
[Concise summary for the session note]
```

Would you like me to:
1. **Add this note** - Run `just session-note "..."` with the summary
2. **Modify first** - Adjust the summary before saving
3. **Skip** - End session without notes

What would you like to do?
