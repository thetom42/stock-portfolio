#!/usr/bin/env bash
# Just Recipe Reminder Hook
# Warns when using direct CLI commands instead of Just recipes
# Exit 0 = allow (never blocks)

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract command (requires jq)
if ! command -v jq &>/dev/null; then
    exit 0  # No jq, skip silently
fi

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

# Check if command starts with monitored CLI tools
case "$cmd" in
    glab\ *)
        echo "Just reminder: Check 'just --list | grep -i <action>' for recipes before using direct glab commands" >&2
        ;;
esac

exit 0
