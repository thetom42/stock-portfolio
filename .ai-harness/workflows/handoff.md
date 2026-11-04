# Handoff Workflow

Purpose: capture session state so any supported Juststart harness can continue
in the same project working copy without rediscovering the same context.

Supported continuation targets are Claude Code, Codex, OpenCode, Antigravity,
and PI Coding Agent. Do not assume the next session will use the same harness,
model, hidden memory, transcript format, or local tool state.

## Cross-Harness Contract

Write the handoff as plain Markdown using repository-relative paths, exact issue
and MR identifiers, commit hashes, branch names, commands, and observed results.
Avoid harness-specific shorthand unless it is clearly labeled as local context.
By default, `just session-note` writes local-only notes to
`.ai-harness/session-notes.md`. If a project overrides that recipe, call out the
actual location explicitly.

Include:

1. Source harness and date/time, if known.
2. Current branch, related issue/MR, latest relevant commits, and push/MR state.
3. Completed work and changed files or directories.
4. Verification performed, including commands and outcomes.
5. Key decisions and why they were made.
6. Open threads, blockers, failing checks, or follow-up questions.
7. Local-only artifacts and explicitly untracked files that should be preserved.
8. The next concrete continuation point, phrased so another harness can act on it.

## Steps

1. Gather the current repository state with deterministic project commands when
   available, such as `just status`, `just log`, and `git status --short`.
2. Summarize completed work, files changed, and verification performed.
3. Record key decisions and why they were made.
4. Note open threads, blockers, and local-only artifacts.
5. Propose the next concrete continuation point.
6. Save the summary through the project's deterministic session-note command
   when the user approves. Leave the `USER NOTES (async handoff)` section at
   the top of the session notes as it is: it belongs to the human.

The adapter decides how to collect the final summary and whether it asks for
confirmation inline or through a command interface. The saved artifact must be
usable by a different harness in the same working copy without access to the
previous transcript.
