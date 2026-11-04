# Shared AI Harness Templates

This directory contains workflow artifacts that are not specific to Claude Code,
Codex, OpenCode, or another coding harness.

Shared artifacts describe workflow intent and deterministic automation:

- `workflows/` documents reusable workflow phases.
- `prompts/` contains prompt templates consumed by deterministic scripts.
- `scripts/` contains shell automation callable from any harness adapter.
- `review-bots.conf` configures review partners once per project.

Harness adapters are responsible for exposing these workflows through their own command, skill, hook, permission, and local configuration formats. Shared workflow files must not contain adapter interpolation syntax such as slash-command arguments, command expansion blocks, or file include directives.
