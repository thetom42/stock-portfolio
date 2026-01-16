# Base Justfile Template
# Common utilities for all project types
# Language-specific recipes (test, lint, build, default, context, etc.) are in their respective templates
#
# NOTE: Do not define 'default' or 'context' here - they are defined in each
# language-specific template to avoid recipe redefinition errors when importing.
# Just does not allow the same recipe to be defined twice.

# ==========================================
# PRE-COMMIT (Git Hooks)
# ==========================================

# Install pre-commit hooks
pre-commit-install:
    #!/usr/bin/env bash
    set -euo pipefail
    if ! command -v pre-commit >/dev/null 2>&1; then
        echo "Installing pre-commit..."
        if command -v uv >/dev/null 2>&1; then
            uv tool install pre-commit
        elif command -v pipx >/dev/null 2>&1; then
            pipx install pre-commit
        elif command -v pip3 >/dev/null 2>&1; then
            pip3 install --user pre-commit
        elif command -v pip >/dev/null 2>&1; then
            pip install --user pre-commit
        else
            echo "Error: No pip, pip3, pipx, or uv found. Install one of them first."
            exit 1
        fi
    fi
    pre-commit install
    pre-commit install --hook-type commit-msg
    echo "Pre-commit hooks installed!"

# Run pre-commit on all files
pre-commit-run:
    pre-commit run --all-files

# Update pre-commit hooks to latest versions
pre-commit-update:
    pre-commit autoupdate

# Uninstall pre-commit hooks
pre-commit-uninstall:
    pre-commit uninstall
    pre-commit uninstall --hook-type commit-msg

# ==========================================
# CLAUDE CODE HOOKS
# ==========================================

# Install Claude Code hooks
# Usage: just hooks-install              # Level 1: session-end + protected-files (default, no startup cost)
#        just hooks-install with-startup # Level 3b: + session-start (auto-catchup at session start)
#        just hooks-install advanced     # All hooks (+ auto-format, command-logging)
# See docs/concept/session-lifecycle.md for cost analysis
hooks-install mode="standard":
    #!/usr/bin/env bash
    set -euo pipefail

    SETTINGS_FILE=".claude/settings.json"
    HOOKS_DIR=".claude/hooks"
    MODE="{{mode}}"

    # Check if hook templates exist
    if [ ! -d "$HOOKS_DIR" ]; then
        echo "Error: Hook templates not found in $HOOKS_DIR"
        echo "Run this command from a project created with 'just init-project'"
        exit 1
    fi

    # Create settings.json if it doesn't exist
    mkdir -p .claude
    if [ ! -f "$SETTINGS_FILE" ]; then
        echo '{}' > "$SETTINGS_FILE"
    fi

    # Check for jq
    if ! command -v jq >/dev/null 2>&1; then
        echo "Error: jq is required but not installed"
        echo "Install with: brew install jq (macOS) or apt install jq (Linux)"
        exit 1
    fi

    # Select hooks based on mode (see docs/concept/session-lifecycle.md)
    if [ "$MODE" = "advanced" ]; then
        echo "Installing Claude Code hooks (advanced - Level 3b + extras)..."
        HOOKS=("session-start" "session-end" "protected-files" "auto-format" "command-logging")
    elif [ "$MODE" = "with-startup" ]; then
        echo "Installing Claude Code hooks (Level 3b - with auto-catchup)..."
        HOOKS=("session-start" "session-end" "protected-files")
    else
        echo "Installing Claude Code hooks (Level 1 - no startup cost)..."
        HOOKS=("session-end" "protected-files")
    fi

    # Build combined hooks object
    COMBINED_HOOKS='{}'
    for hook in "${HOOKS[@]}"; do
        HOOK_FILE="$HOOKS_DIR/${hook}.json"
        if [ -f "$HOOK_FILE" ]; then
            # Extract the hooks object from the template
            HOOK_DATA=$(jq '.hooks // {}' "$HOOK_FILE")
            # Merge into combined hooks
            COMBINED_HOOKS=$(echo "$COMBINED_HOOKS" | jq --argjson new "$HOOK_DATA" '. * $new')
            echo "  ✓ $hook"
        else
            echo "  ✗ $hook (not found)"
        fi
    done

    # Merge hooks into settings.json
    jq --argjson hooks "$COMBINED_HOOKS" '.hooks = (.hooks // {}) * $hooks' "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp"
    mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

    # Copy scripts if needed
    if [ -d "$HOOKS_DIR/scripts" ]; then
        echo ""
        echo "Hook scripts available in $HOOKS_DIR/scripts/"
    fi

    echo ""
    echo "Hooks installed to $SETTINGS_FILE"
    echo "Restart Claude Code to activate."

# Show installed Claude Code hooks (project and global)
hooks-show:
    @if [ -f ".claude/settings.json" ]; then \
        echo "=== Project Hooks (.claude/settings.json) ==="; \
        jq '.hooks // "No hooks configured"' .claude/settings.json 2>/dev/null || cat .claude/settings.json; \
    else \
        echo "No project hooks configured (.claude/settings.json not found)"; \
    fi
    @echo ""
    @if [ -f "$$HOME/.claude/settings.json" ]; then \
        echo "=== Global Hooks (~/.claude/settings.json) ==="; \
        jq '.hooks // "No hooks configured"' "$$HOME/.claude/settings.json" 2>/dev/null || echo "File exists but no hooks section"; \
    else \
        echo "No global hooks configured (~/.claude/settings.json not found)"; \
    fi

# List available Claude Code hook templates
hooks-list:
    @echo "Available hook templates in .claude/hooks/:"
    @if [ -d ".claude/hooks" ]; then \
        for f in .claude/hooks/*.json; do \
            [ -f "$$f" ] || continue; \
            name=$$(basename "$$f" .json); \
            desc=$$(jq -r '._description // "No description"' "$$f" 2>/dev/null); \
            printf "  %-20s %s\n" "$$name" "$$desc"; \
        done; \
    else \
        echo "  (no hooks directory found)"; \
    fi

# ==========================================
# PERMISSIONS (Claude Code / AI Assistants)
# ==========================================

# Install permission level for Claude Code
# Usage: just permissions-install         # Default: 1plus (human approves most actions)
#        just permissions-install 2       # Level 2: Sandboxed development
#        just permissions-install 2plus   # Level 2+: Enhanced isolation
#        just permissions-install 3       # Level 3: Parallel autonomous agents
permissions-install level="1plus":
    #!/usr/bin/env bash
    set -euo pipefail

    LEVEL="{{level}}"
    PERMISSIONS_DIR=".claude/permissions"
    SETTINGS_FILE=".claude/settings.local.json"

    # Normalize level name (allow "1+" as alias for "1plus", "2+" for "2plus", etc.)
    LEVEL="${LEVEL/%+/plus}"

    SOURCE_FILE="${PERMISSIONS_DIR}/level-${LEVEL}.json"

    if [ ! -f "$SOURCE_FILE" ]; then
        echo "Error: Permission level '${LEVEL}' not found"
        echo "Available levels:"
        if [ -d "$PERMISSIONS_DIR" ]; then
            find "$PERMISSIONS_DIR" -name 'level-*.json' -exec basename {} .json \; | sed 's/level-//' | sort
        else
            echo "  (no permissions directory found)"
        fi
        exit 1
    fi

    # Create .claude directory if needed
    mkdir -p .claude

    # Copy the level template to settings.json
    cp "$SOURCE_FILE" "$SETTINGS_FILE"

    echo "Installed permission level: ${LEVEL}"
    echo "Settings written to: ${SETTINGS_FILE}"
    echo ""
    echo "To change level later: just permissions-install <level>"

# Show current permission level
permissions-show:
    @if [ -f ".claude/settings.local.json" ]; then \
        echo "Current permissions (.claude/settings.local.json):"; \
        head -5 .claude/settings.local.json; \
        echo "..."; \
    else \
        echo "No permissions installed (.claude/settings.local.json not found)"; \
        echo "Run 'just permissions-install' to install default level (1plus)"; \
    fi

# List available permission levels
permissions-list:
    #!/usr/bin/env bash
    set -euo pipefail
    echo "Available permission levels:"
    if [ -d ".claude/permissions" ]; then
        if ! command -v jq &> /dev/null; then
            echo "  (jq not installed - install with: brew install jq)"
            exit 1
        fi
        for f in .claude/permissions/level-*.json; do
            level=$(basename "$f" .json | sed 's/level-//')
            comment=$(jq -r '._comment // ""' "$f" 2>/dev/null || echo "")
            printf "  %-8s %s\n" "$level" "$comment"
        done
    else
        echo "  (no permissions directory found)"
    fi

# ==========================================
# CLAUDE CODE SPECIFIC
# ==========================================

# NOTE: 'context' recipe is defined in each language-specific template
# to provide project-type-specific context information.

# Catch up on recent project activity for session continuity
catchup:
    #!/usr/bin/env bash
    set -euo pipefail

    # Show project concept summary if it exists
    # Users can create .claude/concept-summary.md with a brief project overview
    CONCEPT_SUMMARY=".claude/concept-summary.md"
    if [ -f "$CONCEPT_SUMMARY" ]; then
        echo "=== Project Concept ==="
        cat "$CONCEPT_SUMMARY"
        echo ""
    fi

    echo "=== Recent Commits (last 7 days) ==="
    git log --oneline --since="7 days ago" --no-merges 2>/dev/null | head -15 || echo "No recent commits"
    echo ""
    echo "=== Open Issues ==="
    glab issue list --per-page=10 2>/dev/null || gh issue list --limit 10 2>/dev/null || echo "No issue CLI available"
    echo ""
    echo "=== Recently Closed Issues ==="
    glab issue list --closed --per-page=3 2>/dev/null || gh issue list --state closed --limit 3 2>/dev/null || echo "No issue CLI available"
    echo ""
    echo "=== Current Branch Status ==="
    git status --short --branch

    # Show recent session notes if they exist
    SESSION_NOTES=".claude/session-notes.md"
    if [ -f "$SESSION_NOTES" ]; then
        echo ""
        echo "=== Recent Session Notes ==="
        # Show session entries (starting from first "## Session" header)
        sed -n '/^## Session/,$p' "$SESSION_NOTES" 2>/dev/null | head -50
    fi

# Quick catchup - minimal context, no API calls
# Use this at session start to minimize context usage
catchup-quick:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "=== Current Branch Status ==="
    git status --short --branch

    # Show project concept summary if it exists
    CONCEPT_SUMMARY=".claude/concept-summary.md"
    if [ -f "$CONCEPT_SUMMARY" ]; then
        echo ""
        echo "=== Project Concept ==="
        cat "$CONCEPT_SUMMARY"
    fi

    # Show recent session notes if they exist
    SESSION_NOTES=".claude/session-notes.md"
    if [ -f "$SESSION_NOTES" ]; then
        echo ""
        echo "=== Recent Session Notes ==="
        # Show only last 2 sessions to minimize context
        awk '/^## Session/{n++} n>='"$(grep -c '^## Session' "$SESSION_NOTES" 2>/dev/null | awk '{print $1-1}')"'' "$SESSION_NOTES" 2>/dev/null | head -30
    fi

    echo ""
    echo "For full context (issues, commits): just catchup"

# Add a session note for continuity
# Usage: just session-note "Worked on authentication, decided to use JWT"
session-note summary:
    #!/usr/bin/env bash
    set -euo pipefail

    SESSION_NOTES=".claude/session-notes.md"
    MAX_SESSIONS=5
    DATE=$(date +%Y-%m-%d)
    TIME=$(date +%H:%M)

    # Create .claude directory if it doesn't exist
    mkdir -p .claude

    # Create session notes file with header if it doesn't exist
    if [ ! -f "$SESSION_NOTES" ]; then
        {
            echo "# Session Notes"
            echo ""
            echo "Use \`just session-note \"summary\"\` to add entries."
            echo ""
            echo "This file is gitignored (local only). Only the last $MAX_SESSIONS sessions are retained."
        } > "$SESSION_NOTES"
    fi

    # Append new session entry
    {
        echo ""
        echo "## Session $DATE $TIME"
        echo ""
        echo "{{summary}}"
    } >> "$SESSION_NOTES"

    # Retention: keep only last N sessions
    SESSION_COUNT=$(grep -c "^## Session" "$SESSION_NOTES" || echo "0")
    if [ "$SESSION_COUNT" -gt "$MAX_SESSIONS" ]; then
        # Extract header (everything before first "## Session")
        HEADER=$(awk '/^## Session/{exit} {print}' "$SESSION_NOTES")
        # Extract last N sessions
        KEEP_FROM=$((SESSION_COUNT - MAX_SESSIONS + 1))
        SESSIONS=$(awk -v keep="$KEEP_FROM" '/^## Session/{n++} n>=keep' "$SESSION_NOTES")
        # Rewrite file
        {
            echo "$HEADER"
            echo "$SESSIONS"
        } > "$SESSION_NOTES"
    fi

    echo "Session note added to $SESSION_NOTES"

# ==========================================
# GIT ESSENTIALS
# ==========================================

# Show git status
status:
    @git status --short

# Show recent commits
log count="10":
    @git log --oneline -{{count}}

# ==========================================
# FEATURE BRANCH WORKFLOW
# ==========================================

# Create a feature branch
# Usage: just branch-create 42 "user-authentication"
branch-create issue name:
    #!/usr/bin/env bash
    set -euo pipefail

    BRANCH="feature/{{issue}}-{{name}}"

    # Ensure we're on main and up to date
    git checkout main
    git pull --ff-only

    # Create and switch to feature branch
    git checkout -b "$BRANCH"

    echo "Created and switched to branch: $BRANCH"
    echo ""
    echo "When done, create MR with: just mr-create"

# Delete a branch (local and remote)
# Usage: just branch-delete feature/42-user-authentication
branch-delete branch:
    #!/usr/bin/env bash
    set -euo pipefail

    BRANCH="{{branch}}"
    CURRENT=$(git branch --show-current)

    if [ "$CURRENT" = "$BRANCH" ]; then
        echo "Switching to main first..."
        git checkout main
    fi

    # Delete local branch
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        git branch -d "$BRANCH" || git branch -D "$BRANCH"
        echo "Deleted local branch: $BRANCH"
    else
        echo "Local branch $BRANCH does not exist"
    fi

    # Delete remote branch if it exists
    if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
        git push origin --delete "$BRANCH"
        echo "Deleted remote branch: $BRANCH"
    else
        echo "Remote branch $BRANCH does not exist"
    fi

# List feature branches
branch-list:
    @git branch --list "feature/*"

# Show current branch
branch-current:
    @git branch --show-current

# ==========================================
# GIT WORKTREES (Level 3+ Parallel SubAgents)
# ==========================================

# Create a worktree for parallel SubAgent work
# Usage: just worktree-create 42 charts    # Creates ../project-charts with feature/42-charts
#        just worktree-create 42 tables    # Creates ../project-tables with feature/42-tables
worktree-create issue name:
    #!/usr/bin/env bash
    set -euo pipefail

    REPO_NAME=$(basename "$PWD")
    WORKTREE_DIR="../${REPO_NAME}-{{name}}"
    BRANCH="feature/{{issue}}-{{name}}"

    # Check if worktree already exists
    if [ -d "$WORKTREE_DIR" ]; then
        echo "Error: Worktree directory already exists: $WORKTREE_DIR"
        exit 1
    fi

    # Create worktree with new branch
    git worktree add -b "$BRANCH" "$WORKTREE_DIR"

    echo ""
    echo "Created worktree: $WORKTREE_DIR"
    echo "Branch: $BRANCH"
    echo ""
    echo "To use:"
    echo "  cd $WORKTREE_DIR"
    echo "  just deps      # Install dependencies"
    echo "  claude         # Start Claude Code session"
    echo ""
    echo "When done:"
    echo "  just mr-create                     # Create MR from worktree"
    echo "  cd .. && just worktree-remove {{name}}  # Clean up"

# Remove a worktree after MR merge
# Usage: just worktree-remove charts
worktree-remove name:
    #!/usr/bin/env bash
    set -euo pipefail

    REPO_NAME=$(basename "$PWD")
    WORKTREE_DIR="../${REPO_NAME}-{{name}}"

    # Check if we're inside the worktree to be removed
    CURRENT_DIR=$(pwd)
    if [[ "$CURRENT_DIR" == *"${REPO_NAME}-{{name}}"* ]]; then
        echo "Error: Cannot remove worktree from inside it."
        echo "First: cd ../${REPO_NAME}"
        exit 1
    fi

    # Check if worktree exists
    if [ ! -d "$WORKTREE_DIR" ]; then
        echo "Worktree not found: $WORKTREE_DIR"
        echo ""
        echo "Available worktrees:"
        git worktree list
        exit 1
    fi

    # Get branch name from worktree
    BRANCH=$(git -C "$WORKTREE_DIR" branch --show-current 2>/dev/null || echo "")

    # Remove worktree
    git worktree remove "$WORKTREE_DIR"
    echo "Removed worktree: $WORKTREE_DIR"

    # Optionally delete the branch if it was merged
    if [ -n "$BRANCH" ] && [ "$BRANCH" != "main" ] && [ "$BRANCH" != "master" ]; then
        echo ""
        read -p "Delete branch '$BRANCH'? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if git branch -d "$BRANCH" 2>/dev/null; then
                echo "Deleted branch: $BRANCH"
            else
                echo "Branch not fully merged. Use 'git branch -D $BRANCH' to force delete."
            fi
        fi
    fi

# List all worktrees
worktree-list:
    @git worktree list

# Prune stale worktree references
worktree-prune:
    git worktree prune --verbose

# ==========================================
# MONITORING (OpenTelemetry)
# ==========================================

# Initialize monitoring configuration
# Usage: just monitoring-init              # Console output (default)
#        just monitoring-init otlp         # OTLP export to collector
#        just monitoring-init prometheus   # Prometheus metrics
monitoring-init mode="console":
    #!/usr/bin/env bash
    set -euo pipefail

    MODE="{{mode}}"
    ENV_FILE=".claude/monitoring.env"

    mkdir -p .claude

    case "$MODE" in
        console)
            printf '%s\n' \
                "CLAUDE_CODE_ENABLE_TELEMETRY=1" \
                "OTEL_METRICS_EXPORTER=console" \
                "OTEL_LOGS_EXPORTER=console" \
                "OTEL_METRIC_EXPORT_INTERVAL=10000" \
                > "$ENV_FILE"
            ;;
        otlp)
            printf '%s\n' \
                "CLAUDE_CODE_ENABLE_TELEMETRY=1" \
                "OTEL_METRICS_EXPORTER=otlp" \
                "OTEL_LOGS_EXPORTER=otlp" \
                "OTEL_EXPORTER_OTLP_PROTOCOL=grpc" \
                "OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317" \
                > "$ENV_FILE"
            ;;
        prometheus)
            printf '%s\n' \
                "CLAUDE_CODE_ENABLE_TELEMETRY=1" \
                "OTEL_METRICS_EXPORTER=prometheus" \
                "OTEL_LOGS_EXPORTER=console" \
                > "$ENV_FILE"
            ;;
        *)
            echo "Unknown mode: $MODE"
            echo "Available: console, otlp, prometheus"
            exit 1
            ;;
    esac

    echo "Monitoring configured: $ENV_FILE"
    echo ""
    echo "To activate, add to your shell:"
    echo "  source $ENV_FILE"
    echo ""
    echo "Or copy settings to .claude/settings.json"

# Show current monitoring configuration
monitoring-status:
    @echo "=== Monitoring Configuration ==="
    @echo ""
    @echo "CLAUDE_CODE_ENABLE_TELEMETRY: $${CLAUDE_CODE_ENABLE_TELEMETRY:-not set}"
    @echo "OTEL_METRICS_EXPORTER: $${OTEL_METRICS_EXPORTER:-not set}"
    @echo "OTEL_LOGS_EXPORTER: $${OTEL_LOGS_EXPORTER:-not set}"
    @echo "OTEL_EXPORTER_OTLP_ENDPOINT: $${OTEL_EXPORTER_OTLP_ENDPOINT:-not set}"
    @echo ""
    @if [ -f ".claude/monitoring.env" ]; then \
        echo "=== .claude/monitoring.env ==="; \
        cat .claude/monitoring.env; \
    else \
        echo "No .claude/monitoring.env found"; \
        echo "Run 'just monitoring-init' to create"; \
    fi

# Test monitoring configuration
monitoring-test:
    #!/usr/bin/env bash
    set -euo pipefail

    if [ "${CLAUDE_CODE_ENABLE_TELEMETRY:-}" != "1" ]; then
        echo "Error: CLAUDE_CODE_ENABLE_TELEMETRY is not set to 1"
        echo "Run: source .claude/monitoring.env"
        exit 1
    fi

    echo "Telemetry enabled: ✓"
    echo "Metrics exporter: ${OTEL_METRICS_EXPORTER:-console}"
    echo "Logs exporter: ${OTEL_LOGS_EXPORTER:-console}"

    if [ "${OTEL_METRICS_EXPORTER:-}" = "otlp" ]; then
        ENDPOINT="${OTEL_EXPORTER_OTLP_ENDPOINT:-http://localhost:4317}"
        echo ""
        echo "Testing OTLP endpoint: $ENDPOINT"
        if command -v curl >/dev/null 2>&1; then
            if curl -s --connect-timeout 2 "${ENDPOINT%:*}:${ENDPOINT##*:}" >/dev/null 2>&1; then
                echo "Endpoint reachable: ✓"
            else
                echo "Warning: Endpoint may not be reachable"
            fi
        else
            echo "curl not available, skipping endpoint test"
        fi
    fi

    echo ""
    echo "Configuration appears valid."

# ==========================================
# FEATURE BRANCH CLEANUP
# ==========================================

# Clean up after MR merge: switch to main, pull, delete local branch
# Usage: just branch-cleanup              # Auto-detect current branch
#        just branch-cleanup feature/42-foo  # Explicit branch name
branch-cleanup branch="":
    #!/usr/bin/env bash
    set -euo pipefail

    BRANCH="{{branch}}"
    CURRENT=$(git branch --show-current)

    # Auto-detect branch if not specified
    if [ -z "$BRANCH" ]; then
        if [ "$CURRENT" = "main" ] || [ "$CURRENT" = "master" ]; then
            echo "Error: Already on $CURRENT, nothing to clean up."
            echo "Usage: just branch-cleanup <branch-name>"
            exit 1
        fi
        BRANCH="$CURRENT"
    fi

    # Don't allow cleanup of main/master
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        echo "Error: Cannot clean up main/master branch"
        exit 1
    fi

    echo "Cleaning up branch: $BRANCH"

    # Switch to main if on the branch to be deleted
    if [ "$CURRENT" = "$BRANCH" ]; then
        git checkout main
    fi

    # Pull latest changes
    git pull --ff-only

    # Delete local branch
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        if git branch -d "$BRANCH"; then
            echo "Deleted local branch: $BRANCH"
        else
            echo "Warning: Branch not fully merged. Use 'git branch -D $BRANCH' to force delete."
            exit 1
        fi
    else
        echo "Local branch $BRANCH does not exist"
    fi
