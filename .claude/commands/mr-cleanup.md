---
description: Post-MR-merge cleanup and next steps
---
## MR Cleanup

Performing post-merge cleanup:

### 1. Switch to Main Branch

```bash
git checkout main
```

### 2. Pull Latest Changes

```bash
git pull origin main
```

### 3. Delete Local Feature Branch

Identify and delete the merged feature branch:

```bash
git branch --merged main | grep -v "^\*\|main\|master" | head -1
```

Delete it if found (confirm branch name first).

### 4. What's Next?

After cleanup, here's what might need attention:

**Open Issues:**
!`just issue-list 2>/dev/null | head -10 || glab issue list --per-page=5 2>/dev/null || gh issue list --limit 5 2>/dev/null || echo "No issue CLI available"`

**Current Status:**
- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short`
- Pipeline status: !`just ci-status 2>/dev/null | tail -5 || echo "No CI status available"`

**Recent Session Notes:**
!`tail -20 .claude/session-notes.md 2>/dev/null | head -15 || echo "No session notes found"`

---

What would you like to work on next?
