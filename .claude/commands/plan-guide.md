---
description: Guide for creating implementation plans
argument-hint: [task description]
---
## Implementation Plan Guide

Task: $ARGUMENTS

### When to Create a Plan

**Create a plan when:**
- Task involves multiple files or components
- Architectural decisions need to be made
- Approach isn't immediately obvious
- Task might span multiple sessions

**Skip planning for:**
- Single-file changes
- Well-defined bug fixes
- Minor documentation updates

### What a Plan Is — and Isn't

A plan is a **contract and a set of guardrails** for a human-reviewed implementation — the interfaces, the modules to touch, the tests to write, the open questions. It is **not** a prose specification to be auto-expanded into finished code.

The most detailed spec is the program itself. The more a prose plan strains to be exhaustive, the more blanks it inevitably leaves — and an agent fills blanks with training-data defaults (older, abstraction-heavy patterns). Keep the plan tight: pin the boundaries and the critical-path decisions, then review the implementation against them. Aiming for a hand-off so complete that no human review is needed is hyper-waterfall, and it fails the way waterfall did.

### Plan Structure

A good implementation plan includes:

```markdown
## Implementation Plan

1. First concrete step
2. Second step
3. ...

**Files:** list of files to create/modify
**Dependencies:** what must be done first
**Open questions:** uncertainties to resolve
```

### Example Plan

```markdown
## Implementation Plan

1. Create validation utility in `src/utils/validation.ts`
2. Add unit tests in `tests/utils/validation.test.ts`
3. Update UserForm component to use new validation
4. Update API endpoint to use same validation
5. Run full test suite and fix regressions

**Files:** src/utils/validation.ts, tests/utils/, src/components/UserForm.tsx
**Open question:** Should validation errors be i18n-ready?
```

### Workflow Integration

1. **Post to issue** - Add plan as comment on the issue
2. **Display in conversation** - Show plan for immediate visibility
3. **Track progress** - Use checkbox format:

```
[ ] 1. Pending task
[x] 2. Completed task
[ ] 3. Another pending task
```

Note: Use `[ ]` and `[x]` directly, NOT as Markdown list items (`- [ ]`).

4. **Update between steps** - Redisplay plan after completing each step

### Best Practices

- **Be specific** - "Update UserForm" not "Make changes"
- **Order matters** - Dependencies first
- **Right granularity** - Not too detailed, not too vague
- **Identify risks** - Note open questions upfront
- **Consider testing** - Include test steps

### Plan Template

```markdown
## Implementation Plan for [Feature/Fix Name]

### Overview
Brief description of what we're implementing.

### Steps
1. [ ] Step one
2. [ ] Step two
3. [ ] Step three

### Files Affected
- `path/to/file1.ts` - description of changes
- `path/to/file2.ts` - description of changes

### Dependencies
- Prerequisite 1
- Prerequisite 2

### Open Questions
- Question that needs clarification?

### Testing Strategy
- How will we verify this works?
```

---

Would you like me to help create a plan for your task?
