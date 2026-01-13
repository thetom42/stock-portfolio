---
description: Backlog refinement session
argument-hint: [issue-numbers or "backlog"]
---
## Backlog Refinement

Focus: $ARGUMENTS

### Context

- Backlog: !`glab issue list --per-page=10 2>/dev/null || gh issue list --limit 10 2>/dev/null || echo "Issue CLI not available"`
- Labels: !`glab label list 2>/dev/null | head -10 || echo "Labels not available"`

### Refinement checklist

For each issue, we'll assess:

| Aspect | Question |
|--------|----------|
| **Clarity** | Is the requirement clear and unambiguous? |
| **Acceptance Criteria** | How do we know when it's done? |
| **Dependencies** | What needs to happen first? |
| **Complexity** | Rough size estimate (S/M/L/XL)? |
| **Questions** | What's still unclear? |

### Process

1. Select an issue to refine
2. Review current description
3. Discuss and clarify
4. Update issue with refined information
5. Move to next issue

### Output

I can help:
- Suggest acceptance criteria
- Identify missing information
- Break down large issues
- Update issue descriptions (with your approval)

Which issue should we start with?
