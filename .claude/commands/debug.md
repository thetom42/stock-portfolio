---
description: Structured debugging session with systematic problem analysis
argument-hint: [error message or symptom]
---
## Debugging Session

Problem: $ARGUMENTS

### Context

- Current branch: !`git branch --show-current`
- Recent changes: !`git log --oneline -5 2>/dev/null || echo "No git history"`
- Modified files: !`git status --short 2>/dev/null || echo "Not a git repo"`

### Systematic Approach

I'll help debug this issue using a structured approach:

1. **Reproduce** - Can we consistently trigger this problem?
2. **Isolate** - What's the smallest case that shows the issue?
3. **Hypothesize** - What could cause this behavior?
4. **Test** - How do we verify each hypothesis?
5. **Fix** - Minimal change to resolve the issue
6. **Verify** - Confirm the fix works and doesn't break other things

### Questions to start

1. When did this start happening?
2. Is it consistent or intermittent?
3. What have you already tried?
4. Any recent changes that might be related?

### Project context

@CLAUDE.md

Let's start - can you describe when and how this problem occurs?
