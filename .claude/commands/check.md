---
description: Monitor CI pipeline, fix failures, repeat until green
---
## CI Pipeline Check

Monitoring the CI pipeline and fixing any issues.

### Current Pipeline Status

!`just ci-status 2>/dev/null || glab ci status 2>/dev/null || gh run list --limit 1 2>/dev/null || echo "No CI status available"`

### Action Loop

Based on the pipeline status:

**If running:**
- Wait for completion, then re-check status

**If failed:**
1. Analyze failed job logs:
   ```bash
   just ci-logs <job-name>  # or: glab ci view
   ```
2. Identify the root cause
3. Implement the fix
4. Commit with message referencing the issue
5. Push changes
6. Monitor the new pipeline
7. Repeat until green

**If success:**
- Pipeline is green, ready to proceed

### Quick Commands

```bash
# View pipeline status
just ci-status

# View job logs (GitLab)
glab ci view

# View job logs (GitHub)
gh run view

# Wait for pipeline
just ci-wait
```

---

Let me check the current pipeline status and take appropriate action.
