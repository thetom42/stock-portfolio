#!/usr/bin/env bash
# Wrapper: run the privacy-roster-guard UserPromptSubmit hook. The python script
# reads the prompt JSON from stdin; this wrapper provides a graceful fallback
# when python3 is unavailable (allow with a warning rather than block prompts).
command -v python3 >/dev/null 2>&1 || { echo "Warning: python3 unavailable, privacy-roster-guard skipped" >&2; exit 0; }
exec python3 "$(dirname "$0")/privacy-roster-guard.py"
