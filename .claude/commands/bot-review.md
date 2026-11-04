---
description: Run automated MR review loop with configurable bot (default: codex)
---
## Automated Bot Review

Run a headless AI review on the current MR, fix findings, and repeat until clean.

### Arguments

- `$ARGUMENTS` can be: `<mr-iid>`, `<mr-iid> <bot-name>`, or `<mr-iid> <bot-name> <model>`
- Bot defaults to `codex` if not specified
- `<bot-name>` may be a single bot or a **comma-separated list** (e.g. `codex,opencode`). With a list, each reviewer runs independently and posts its own attributed note. Two reviewers with different model priors catch more real bugs than one (a model is biased toward its own idioms; they rarely flag the same line). Single reviewer stays the default; multi-reviewer is opt-in.
- Model is optional — when provided, passed to the CLI via the bot's configured model-flag
- Bot CLI, identity, and model flag are configured in `.ai-harness/review-bots.conf`

### Prerequisites

Verify before starting:

1. You are on a feature branch (not main)
2. An MR exists for this branch
3. All changes are committed and pushed
4. `just ci` passes

### Step 0: Code Simplification

**Before starting the review loop**, run the code-simplifier on all files changed in this MR:

1. Run `git fetch origin` and `git diff origin/<target-branch>...HEAD --name-only` to identify changed files (never a local `main`: nothing updates it, and a stale one pulls in merged work, #412)
2. Use the `code-simplifier` agent (from pr-review-toolkit plugin) on the implementation files (skip test files)
3. If the simplifier made changes, commit with `refactor: simplify code before review (refs #<issue>)` and push

This reduces review findings and ensures clean, maintainable code reaches the reviewer.

### Step 0.5: Ensure the MR Description Has a Test Plan

Reviewers verify the MR's test plan item by item, and the post-review check below ticks it off, so it has to exist before round 1:

1. The description has a `## Test plan` section: one Markdown task item (`- [ ] ...`) per line, each a concrete check that can be run or observed (a command and its expected result, a smoke test, a negative check against the target branch). "Tests pass" is not an item.
2. If the issue defines acceptance criteria, the description also has an `## Acceptance Criteria` checklist with one item per criterion.
3. If either is missing, write the full description to a file and send it unchanged:
   ```bash
   GIT_BOT=<your-bot> just mr-update-file <mr-iid> /tmp/mr-<mr-iid>.md
   ```

The canonical shape is `## Summary`, then `## Acceptance Criteria` (when the issue has criteria), then `## Test plan`, plus a short note for anything the MR does beyond the issue's scope.

### Review Loop (max 10 iterations)

For each round:

1. **Invoke the review script:**
   ```bash
   # single reviewer
   .ai-harness/scripts/bot-review.sh <bot-name> <mr-iid> <round> [model]
   # multiple reviewers (each posts its own attributed note)
   .ai-harness/scripts/bot-review.sh codex,opencode <mr-iid> <round> [model]
   ```
   With a list, one reviewer failing does not abort the others; the run only
   fails if no reviewer produced output.
2. **Read the output.** The script posts each reviewer's findings as its own bot MR note automatically.
3. **If findings exist:**
   - **Aggregate across reviewers and deduplicate:** the same `[file:line]` and claim reported by two reviewers is one finding, not two.
   - **Verify each finding before acting (meta-review):** confirm it against the actual diff. This driver-side step is what keeps false positives — which multiple, and later adversarial, reviewers can raise — out of the code. Do not perform fixes just because a reviewer asserted a problem.
   - Analyze each finding — is it valid and within MR scope?
   - Fix valid findings. Ignore findings about code not changed in this MR.
   - Commit with message: `fix: address <bot> review - <summary> (refs #<issue>)`
   - Push to the feature branch
   - **Post a fix-note on the MR** summarizing what was addressed:
     ```bash
     # Post a plain MR comment (no resolvable thread, no glab deprecation — see #300).
     # Ambient token AND host variables would override the bot's config (#443).
     env -u GITLAB_TOKEN -u GITLAB_ACCESS_TOKEN -u OAUTH_TOKEN -u GITLAB_HOST -u GITLAB_URI -u GL_HOST -u GITLAB_API_HOST GLAB_CONFIG_DIR=~/.config/glab-<your-bot> glab api --method POST "projects/:id/merge_requests/<mr-iid>/notes" -f "body=Fixed in <commit-hash>: <bullet list of findings addressed>"
     ```
   - Increment round and go to step 1
4. **If no findings (clean review):** Exit the loop.

### Post-Review Verification

After a clean review:

1. **Check test plan:** Read the reviewer's "Test plan verification" section.
   - Items marked **Pass** → check them off in the MR description
   - Items the reviewer could not verify (e.g., `just ci` in read-only sandbox) → verify yourself, then check them off
2. **Check acceptance criteria:** If the reviewer verified issue acceptance criteria, confirm and check them off.
3. **Update MR description** with all items checked.
4. **Set human reviewer** (e.g., thetom42) as final reviewer, using your bot-specific glab config:
   ```bash
   env -u GITLAB_TOKEN -u GITLAB_ACCESS_TOKEN -u OAUTH_TOKEN -u GITLAB_HOST -u GITLAB_URI -u GL_HOST -u GITLAB_API_HOST GLAB_CONFIG_DIR=~/.config/glab-<your-bot> glab api "projects/:id/merge_requests/<iid>" --method PUT -f "reviewer_ids=<human-user-id>"
   ```
5. **Leave the merge to the human final reviewer.** A clean bot review is not a merge approval. Merge yourself only where the project owner has explicitly delegated merging to you.

### Error Handling

- If the review script fails, check: Is the bot CLI installed? Is `.ai-harness/review-bots.conf` present (copy from `review-bots.conf.sample` if not)? Is the glab config for this bot set up?
- If note posting fails, the script outputs the review to stdout — post it manually.
- If you hit 10 iterations without a clean review, stop and ask the user for guidance.

### Available Bots

Check `.ai-harness/review-bots.conf` for configured bots (format: `bot-name|cli-command|glab-config-dir|model-flag|default-model`; `default-model` is required for a command that carries `--ignore-user-config`, see the conf header).

### Model Selection Examples

```bash
# Use default model (no model argument)
.ai-harness/scripts/bot-review.sh codex 42 1

# Codex with o3
.ai-harness/scripts/bot-review.sh codex 42 1 o3

# Gemini via the Antigravity CLI, with a specific model (names come from `agy models`)
.ai-harness/scripts/bot-review.sh gemini 42 1 "Gemini 3.1 Pro (High)"

# Two reviewers with different model priors (each posts its own note)
.ai-harness/scripts/bot-review.sh codex,opencode 42 1
```
