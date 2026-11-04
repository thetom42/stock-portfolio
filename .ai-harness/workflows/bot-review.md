# Bot Review Workflow

Purpose: run one or more headless review partners on a merge request, post
findings, and iterate until the review is clean or human judgment is needed.

Prerequisites:

1. Work is on a feature branch.
2. A merge request exists for the branch.
3. Changes are committed and pushed.
4. The project quality gate passes.
5. The selected review partner(s) are configured in the shared review bot config.
6. The MR description carries a test plan (see below).

Test plan:

- Before round 1, the MR description needs a `## Test plan` section: one
  Markdown task item (`- [ ] ...`) per line, each naming a concrete check
  that can be run or observed, such as a command and its expected result, a
  smoke test, or a negative check against the target branch. Reviewers verify
  the plan item by item and report each item's result; a plan that says "tests
  pass" gives them nothing to check.
- When the issue defines acceptance criteria, the description also carries an
  `## Acceptance Criteria` checklist with one item per criterion.
- If either is missing, write it and update the description before starting.
  In GitLab projects that is `GIT_BOT=<bot> just mr-update-file <mr-iid>
  <file>`, which sends the file as written.
- The canonical shape is `## Summary`, then `## Acceptance Criteria` (when the
  issue has criteria), then `## Test plan`, plus a short note for anything the
  MR does beyond the issue's scope.

Reviewers:

- The reviewer argument is a single bot name (e.g. `codex`) or a comma-separated
  list (e.g. `codex,opencode`).
- With a list, each reviewer runs independently and posts its own attributed
  note. Two reviewers with different model priors catch more real bugs than one,
  because a single model is biased toward its own idioms — they rarely flag the
  same line. A single reviewer stays the default; multi-reviewer is opt-in.

Reviewers are output-only; the script posts:

- A reviewer writes its review to standard output and nothing else. The shared
  script posts it as one attributed note per reviewer per round and leaves
  reviewers, labels and the MR description to the driver. The reason is
  uniformity across bots that cannot write to GitLab at all (`claude -p
  --permission-mode plan`, `pi --tools read,grep,find,ls`): if one bot posted
  itself, a mixed reviewer list would produce duplicate or early notes for that
  bot only, and every downstream rule (read each posted note, deduplicate
  across reviewers) would need a special case. A reviewer also reads untrusted
  MR and issue text, so it must have no control-plane rights.
- That boundary has to be enforced by the invocation, not asked for in the
  prompt: codex's `approvals_reviewer` auto-approval grants a `--sandbox
  read-only` reviewer every escalation it requests, so the shipped command
  carries `--ignore-user-config` and a default model in the conf (the flag
  drops the user's model along with the auto-approval). The prompt still says
  it, so a reviewer does not spend a round trying.

Loop:

1. Invoke the shared review script with merge request number, reviewer name (or
   comma-separated list), review round, and optional model.
2. Read every posted review note (one per reviewer).
3. Aggregate findings across reviewers and deduplicate them: the same
   `[file:line]` and claim reported by two reviewers is one finding, not two.
4. Verify each aggregated finding before acting on it — this driver-side
   "meta-review" step is what keeps false positives (which multiple, and later
   adversarial, reviewers can raise) from reaching the code. Decide whether each
   finding is valid and in scope.
5. Fix valid in-scope findings.
6. Run the quality gate.
7. Commit fixes with an issue reference and push.
8. Post a fix note that summarizes addressed findings and, where relevant, which
   reviewer raised them.
9. Start the next review round.

Stop after a clean review or when repeated rounds require human guidance.

Hand-off after a clean review:

1. Check off the test plan items the reviewers verified. Verify the items they
   could not run (a quality gate in a read-only sandbox, say) yourself, then
   check those off too. Do the same for the acceptance criteria.
2. Update the MR description with the checked items.
3. Set the project's human owner as the MR's reviewer, acting as your own bot
   identity. In GitLab projects, clear the ambient token and host variables so
   the call cannot act as whoever owns them:

   ```bash
   env -u GITLAB_TOKEN -u GITLAB_ACCESS_TOKEN -u OAUTH_TOKEN -u GITLAB_HOST -u GITLAB_URI -u GL_HOST -u GITLAB_API_HOST GLAB_CONFIG_DIR=~/.config/glab-<your-bot> glab mr update <mr-iid> --reviewer <human-username>
   ```
4. Leave the merge to that human, who is the final reviewer. A clean bot review
   is not a merge approval. Merge yourself only where the project owner has
   explicitly delegated merging to you.

The script reviews the working tree, so check out the MR's source branch at the
MR's head commit (pulled and pushed), with no uncommitted changes to tracked
files, and leave the checkout alone while it runs: each reviewer refuses to
start on any other branch, commit or dirty tree, and refuses to post when the
branch, HEAD or a tracked file changed during its run. Untracked files are fine.
Use a separate worktree for parallel work.

Each reviewer run is limited to `REVIEW_TIMEOUT` seconds (default 1800). A run
that exceeds it is stopped with its child processes, reported as timed out, and
posts nothing; raise the limit only for a review that genuinely needs longer.

Before each review, the script runs a write canary: the same invocation is
asked to create a file in the project root. A reviewer is output-only because
its CLI's sandbox denies writes, and that sandbox is somebody else's default.
When codex's auto-approval began granting escalations, reviews looked exactly
the same and nothing failed. The canary tests the effect, not the flags. If the
file appears, that reviewer's review never starts, nothing is posted for it,
and the whole run fails, naming the bot and its CLI version. The file is
looked for even when the reviewer then fails or times out. A reviewer that
cannot answer the canary, or that claims it wrote a file that is not there,
counts as unchecked and is not run either. The
canary costs one short model call per reviewer per round and has at most
`CANARY_TIMEOUT` seconds (default 300, never more than `REVIEW_TIMEOUT`).
`BOT_REVIEW_CANARY=0` skips it with a warning; only use it while a reviewer CLI
is known to be broken, since the value is in the check running when nobody is
thinking about it.

Each note ends with a `Reviewed:` line naming the diff it covered. A follow-up
round covers every commit since that reviewer's last posted review, however many
there are; the script finds the base in a hidden marker in that note. When no
usable base exists (no earlier note, rewritten history), the round reviews the
full MR diff and says why. A clean note is only evidence for the range it names.
After a void round (wrong branch, wrong bot, aborted run), start the next one
with `REVIEW_SCOPE=full` to review the whole MR again.

Below the `Reviewed:` line, a `Context:` line says what the reviewer was given:
the MR description and every linked issue, or that either was missing. Linked
issues are the ones GitLab says the merge closes (its `closes_issues` answer,
every page), read from the MR title, description and commit messages, and
including issues of other projects the bot can read. GitLab reads closing
references inside code spans too, so quoting `Closes #4` as an example in an MR
description closes #4 on merge. An external tracker's issue is given by its
title only.

GitLab's answer is empty for an MR whose target is not the default branch, and
it leaves out issues the bot cannot see. Only when it is empty is the
description read as plain text instead, code examples included: every issue of
this project after a closing keyword or `Refs` (lists such as `Closes #4, #6`
included, by `#N`, by the project's path or name in any case, or by its issue
URL) is fetched and marked `from the MR description text`, and references to
another project are listed as `not fetched`. A failed or unreadable answer for
any linked issue stops the review, so an example that names a missing issue
blocks it; quote such examples without the `#`. An issue hidden from a
non-empty answer goes unnoticed.
