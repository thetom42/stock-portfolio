#!/bin/bash
# Check that commit message contains an issue reference
# Used by pre-commit hook (commit-msg stage)
#
# Exception: a docs: commit may omit the reference. That is the "Minor docs /
# typo fix -> Direct commit" row of the Workflow Decision Guide. chore: is not
# exempt: a dependency bump or a harness update is a change and needs an
# issue (#373).

if [ -z "$1" ]; then
    echo "ERROR: No commit message file provided"
    exit 1
fi

# Only the subject line decides the type, so a body line that happens to start
# with "docs:" does not exempt a feat: commit.
if head -n 1 "$1" | grep -qE "^docs(\([^)]*\))?:"; then
    exit 0
fi

# The keyword is required as a word of its own, and the number must end
# there: a bare #5, a colour like #6699cc or "prefs #42" is no issue
# reference. Only "refs" counts: commits never close an issue, the MR's
# "Closes #N" does (#424).
if grep -qE "(^|[^0-9A-Za-z_])refs #[0-9]+([^0-9A-Za-z_]|$)" "$1"; then
    exit 0
else
    echo "ERROR: Commit message must contain issue reference (e.g., refs #42)"
    echo "       Use refs, not closes: the MR description closes the issue."
    echo "       Exception: docs: commits (minor docs / typo fixes) may omit it."
    exit 1
fi
