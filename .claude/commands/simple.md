---
description: Run code-simplifier on recent changes, then verify with CI
---
## Code Simplification & Verification

Run this before creating MRs/PRs to ensure clean, simplified code.

### Step 1: Code Simplifier

Use the code-simplifier agent on recently modified files:

```
Run the code-simplifier agent (from pr-review-toolkit plugin) on files
changed since the last commit or currently staged/unstaged changes.
Focus on the actual implementation files, not test files.
```

### Step 2: CI Verification

After simplification, verify all checks pass:

```bash
just ci
```

### Step 3: Report

- If CI passes: Ready for MR/PR creation
- If CI fails: Fix issues and re-run `/simple`

---

Let me start by running the code-simplifier agent on your recent changes.
