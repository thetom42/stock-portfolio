---
description: Pre-MR checklist to verify all workflow steps before creating a merge request
---
## Pre-MR Checklist

Run this checklist before creating a Merge Request to ensure all workflow steps are complete.

### Current Status

- Branch: !`git branch --show-current`
- Uncommitted changes: !`git status --short | head -5`
- Unpushed commits: !`git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | head -5 || echo "Branch not pushed yet"`

### Checklist

Review each item and confirm completion:

#### Planning & Documentation
- [ ] **Issue exists** - Every change needs an issue (`/workflow issue`)
- [ ] **Plan posted** - Implementation plan as issue comment (`/plan-guide`)
- [ ] **Feature branch** - Working on `feature/<id>-name`, not main

#### Implementation
- [ ] **Commits reference issue** - All commits use `(refs #issue)` format
- [ ] **No secrets in code** - Review with `git diff --staged`
- [ ] **Documentation updated** - If API/behavior changed

#### Quality Gates
- [ ] **Code simplified** - Run `/simple` to simplify and verify CI
- [ ] **CI passes locally** - `just ci` succeeds
- [ ] **All changes pushed** - No unpushed commits

### Quick Commands

```bash
# Check CI status
just ci

# Push changes
git push origin $(git branch --show-current)

# Create MR
just mr-create
```

### Ready?

If all items are checked:
1. Push any remaining commits
2. Run `just mr-create`
3. Include `Closes #<issue>` in MR description

---

Need help with a specific step? Use `/workflow <topic>` for guidance.
