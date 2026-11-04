# Catchup Workflow

Purpose: restore project and session context at the start of work, even when
the previous handoff in the same working copy was written by a different
supported Juststart harness.

Supported handoff sources are Claude Code, Codex, OpenCode, Antigravity, and PI
Coding Agent. Do not assume the previous session used the current harness, model,
hidden memory, transcript format, or local tool state.

## Cross-Harness Restoration

Treat deterministic project commands and artifacts as the source of truth:

1. Project instructions such as `AGENTS.md`, `CLAUDE.md`, or equivalent local
   guidance.
2. Session notes or handoffs shown through project commands such as
   `just catchup` and produced through commands such as `just session-note`.
   By default, these notes are local-only at `.ai-harness/session-notes.md`;
   legacy projects may still have `.claude/session-notes.md`.
3. Git state: branch, uncommitted changes, recent commits, tracking branch, and
   related issue/MR identifiers.
4. Versioned workflow artifacts under `.ai-harness/` and adapter-specific
   project config under `.claude/`, `.codex/`, `.opencode/`, `.agents/`, and
   `.pi/` when present.

## Steps

1. Run the deterministic project catchup command when available.
   If it prints `User Notes (async handoff)`, read them first: the human left
   them between sessions, and they take precedence over the session notes.
   Do not edit or delete them; the human removes an entry once it is done.
2. Identify the current branch, uncommitted changes, and recent commits.
3. Read project instructions before making recommendations.
4. Read recent session notes or handoff text and identify the source harness if
   it is recorded.
5. Translate the handoff into the current harness context: available tools,
   required approvals, protected files, and commands to prefer.
6. Summarize recent project activity, active work, local-only artifacts, likely
   next steps, and any assumptions that still need verification.
7. Ask what the user wants to focus on next if no active task was provided.

The adapter decides how to expose this workflow and how command output is
embedded in its user-facing surface. The restored context must stand on
deterministic project commands and explicit local or versioned artifacts, not on
hidden memory from a prior harness session.
