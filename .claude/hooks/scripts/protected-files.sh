#!/usr/bin/env bash
# Wrapper: run the protected-files PreToolUse hook. The python script reads
# the tool JSON from stdin; this wrapper just provides a graceful fallback when
# python3 is unavailable (allow with a warning rather than break the tool, #434).
command -v python3 >/dev/null 2>&1 || { echo "Warning: python3 unavailable, protected-files check skipped" >&2; exit 0; }
exec python3 "$(dirname "$0")/protected-files.py"
