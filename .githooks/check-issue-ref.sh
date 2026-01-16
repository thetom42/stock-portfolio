#!/bin/bash
# Check that commit message contains an issue reference
# Used by pre-commit hook (commit-msg stage)

if [ -z "$1" ]; then
    echo "ERROR: No commit message file provided"
    exit 1
fi

if grep -qE "(refs|closes|Closes) #[0-9]+|#[0-9]+" "$1"; then
    exit 0
else
    echo "ERROR: Commit message must contain issue reference (e.g., refs #42)"
    exit 1
fi
