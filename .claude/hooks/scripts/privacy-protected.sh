#!/usr/bin/env bash
# Wrapper: run the privacy-protected PreToolUse hook. The python script reads
# the tool JSON from stdin; this wrapper just provides a graceful fallback when
# python3 is unavailable (allow with a warning rather than break the tool).
command -v python3 >/dev/null 2>&1 || { echo "Warning: python3 unavailable, privacy-protected check skipped" >&2; exit 0; }
exec python3 "$(dirname "$0")/privacy-protected.py"
