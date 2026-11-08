#!/usr/bin/env bash
# Just Recipe Reminder Hook (PreToolUse, Bash)
# BLOCKS a glab/gh command when a Just recipe covers that exact operation, and
# only REMINDS when recipes exist for the family but not for the operation.
# The file keeps its old name for compatibility with installed settings.
# Exit 0 = allow (reminders go to stderr), Exit 2 = block
#
#   glab mr note 12 ...  ->  mr-note exists          ->  block, name the recipe
#   glab mr rebase 12    ->  mr-* exists, no mr-rebase ->  remind, allow
#   glab api ...         ->  no api-* recipe         ->  allow silently

set -euo pipefail

input=$(cat)

# Require jq for JSON parsing
if ! command -v jq &>/dev/null; then
    exit 0  # No jq, allow silently
fi

cmd=$(echo "$input" | jq -r '.tool_input.command // ""' 2>/dev/null) || exit 0

case "$cmd" in
    glab\ *|gh\ *) ;;
    *) exit 0 ;;
esac

# tool, family and operation: "glab mr note 12" -> glab, mr, note.
# Flags between them (glab -R x mr note) are not handled; such a command is
# allowed, which errs on the side of not blocking.
read -r tool action op _ <<<"$cmd" || true
[[ -n "${action:-}" ]] || exit 0

# Recipe names are the first word of the indented, non-comment lines of
# `just --list`. The list is read once and then searched: `just --list |
# grep -q` fails under pipefail, because just dies of SIGPIPE when grep stops
# reading at its first match (#201).
listing=$(just --list 2>/dev/null) || listing=""
names=$(awk 'NR > 1 && /^[[:space:]]+[[:alnum:]]/ {print $1}' <<<"$listing")

if [[ -n "${op:-}" ]] && grep -qxF -- "$action-$op" <<<"$names"; then
    # Exit 2 hands stderr to the agent; stdout would not reach it.
    echo "BLOCKED: use 'just $action-$op' instead of '$tool $action $op'" >&2
    echo "Run 'just --list' to see its parameters" >&2
    exit 2
fi

if grep -q -- "^$action-" <<<"$names"; then
    family=$(grep -- "^$action-" <<<"$names" | tr '\n' ' ')
    echo "Note: no recipe covers '$tool $action${op:+ $op}'; related recipes: ${family% }" >&2
fi

exit 0
