---
description: Sprint planning session
argument-hint: [sprint-goal or empty]
---
## Sprint Planning

Sprint Goal: $ARGUMENTS

### Context

- Open issues: !`glab issue list --per-page=15 2>/dev/null || gh issue list --limit 15 2>/dev/null || echo "Issue CLI not available"`
- Recent activity: !`git log --oneline --since="2 weeks ago" --no-merges 2>/dev/null | head -10 || echo "No recent commits"`
- Current branch: !`git branch --show-current`

### Agenda

1. **Review** - What was accomplished since last planning?
2. **Sprint Goal** - What's the main objective for this sprint?
3. **Capacity** - How much time/effort is available?
4. **Selection** - Which issues should we include?
5. **Commitment** - Final sprint backlog

### Planning questions

- What's the team's capacity for this sprint?
- Are there any blockers or dependencies?
- Which issues are highest priority?
- Are the selected issues well-defined (refined)?

### Output

I can help:
- Prioritize the backlog
- Identify dependencies between issues
- Suggest issue groupings
- Document the sprint commitment

What's our focus for this sprint?
