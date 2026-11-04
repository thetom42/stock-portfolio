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
# GIT CREDENTIAL BOT
# ==========================================

# Install git-credential-bot for bot identity support
# Copies the host-aware credential helper to /usr/local/bin and configures
# the current repo to use it. Uses sudo unless the target directory and an
# existing helper are both writable.
#
# The credential helper reads tokens from glab config files at runtime:
#   GIT_BOT=claude git push  →  finds token in ~/.config/glab-claude*/config.yml
#
# Precedence pitfall: git collects credential.helper from every scope
# (system → global → local) and the first helper that returns a complete
# credential wins. A global `credential.helper=store` therefore shadows this
# repo-local helper and pushes run under the wrong identity. We defend against
# that by resetting the helper list with an empty value before adding our own,
# so the local config drops any inherited helper for this repo.
#
# Usage: just credential-bot-install
credential-bot-install:
    #!/usr/bin/env bash
    set -euo pipefail
    # The justfile's own directory, not a nested `just --evaluate`, which looks
    # for a justfile in the cwd and misses under --working-directory.
    JUSTFILE_DIR={{quote(justfile_directory())}}
    # Overridable for tests; the helper is configured by this absolute path.
    INSTALL_PATH="${CREDENTIAL_BOT_INSTALL_PATH:-/usr/local/bin/git-credential-bot}"

    # Find source: generated projects have scripts/, juststart has templates/scripts/
    if [[ -f "$JUSTFILE_DIR/scripts/git-credential-bot" ]]; then
        SCRIPT_SRC="$JUSTFILE_DIR/scripts/git-credential-bot"
    elif [[ -f "$JUSTFILE_DIR/templates/scripts/git-credential-bot" ]]; then
        SCRIPT_SRC="$JUSTFILE_DIR/templates/scripts/git-credential-bot"
    else
        SCRIPT_SRC=""
    fi

    # sudo unless both the target directory and an existing helper are
    # writable. Being in a container says nothing about that: a devcontainer's
    # post-create runs as the unprivileged container user, and /usr/local/bin is
    # root's (#374, #358). The file counts too: a user-owned /usr/local/bin
    # (Homebrew on Intel macOS) can hold a root-owned helper from an earlier
    # sudo install, and replacing that is root's business.
    if [[ -w "$(dirname "$INSTALL_PATH")" ]] && { [[ ! -e "$INSTALL_PATH" ]] || [[ -w "$INSTALL_PATH" ]]; }; then
        SUDO=""
    else
        SUDO="sudo"
    fi

    # Check if source script was found
    if [[ -z "$SCRIPT_SRC" ]]; then
        # Fallback: check if already installed and up to date
        if [[ -f "$INSTALL_PATH" ]]; then
            echo "✓ git-credential-bot already installed at $INSTALL_PATH"
        else
            echo "Error: git-credential-bot not found. Searched:" >&2
            echo "  $JUSTFILE_DIR/scripts/git-credential-bot" >&2
            echo "  $JUSTFILE_DIR/templates/scripts/git-credential-bot" >&2
            echo "Install it into the project with Juststart's scripts-install recipe:" >&2
            echo "  just --justfile <juststart>/justfile scripts-install $JUSTFILE_DIR" >&2
            exit 1
        fi
    else
        if [[ -f "$INSTALL_PATH" ]] && diff -q "$SCRIPT_SRC" "$INSTALL_PATH" >/dev/null 2>&1; then
            echo "✓ git-credential-bot is up to date"
        else
            echo "Installing git-credential-bot to $INSTALL_PATH..."
            $SUDO install -m 0755 "$SCRIPT_SRC" "$INSTALL_PATH"
            echo "✓ Installed git-credential-bot"
        fi
    fi

    # Configure credential helper in this repo.
    # Reset the local helper list first (empty value clears any helper inherited
    # from system/global scope, e.g. a global `store`), then add ours — otherwise
    # an inherited helper wins by precedence and shadows this one.
    git config --local --replace-all credential.helper ""
    git config --local --add credential.helper "$INSTALL_PATH"
    echo "✓ Configured credential.helper for this repo"

    # Show discovered glab configs
    echo ""
    echo "Available bot configs:"
    for dir in "$HOME"/.config/glab-*; do
        [[ -d "$dir" ]] || continue
        bot=$(basename "$dir" | sed 's/^glab-//')
        hosts=$(grep -E "^    [a-zA-Z]" "$dir/config.yml" 2>/dev/null | sed 's/:.*//' | tr -d ' ' | paste -sd, -)
        echo "  $bot → $hosts"
    done

# Wire git-credential-bot as this repo's credential helper when GIT_BOT is
# set, before a first push (#364). A fresh repo has no helper of its own and
# inherits the global one (osxkeychain, store), which pushes as whatever
# identity it has cached; GIT_BOT reaches git only through this helper. The
# empty value drops inherited helpers, as in credential-bot-install. Without
# GIT_BOT the operator's own credentials are meant, and nothing changes.
# Where gitlab.just is imported, GIT_BOT here is the bot it resolved (explicit,
# from GLAB_CONFIG_DIR, or the only configured one): the identity glab created
# the remote as, so the push goes out as the same one.
_credential-bot-wire:
    #!/usr/bin/env bash
    set -euo pipefail
    [[ -n "${GIT_BOT:-}" ]] || exit 0
    HELPER=$(command -v git-credential-bot || true)
    if [[ -z "$HELPER" ]]; then
        echo "Error: GIT_BOT=$GIT_BOT is set, but git-credential-bot is not installed;" >&2
        echo "  a push would run as whatever identity git has cached, not as the bot." >&2
        echo "  The remote exists and origin is set. To finish, from $(pwd):" >&2
        echo "    just credential-bot-install" >&2
        echo "    GIT_BOT=$(printf '%q' "$GIT_BOT") git push -u origin \"\$(git branch --show-current)\"" >&2
        exit 1
    fi
    git config --local --replace-all credential.helper ""
    git config --local --add credential.helper "$HELPER"
    echo "Configured credential.helper for GIT_BOT=$GIT_BOT: $HELPER"

# Push a branch to origin and set its upstream. A rejected first push is
# usually the identity, not the role (#364), so a rejection says how to check
# the effective helper and how to finish. On GitLab, GIT_BOT stays in those
# commands: once _credential-bot-wire has run, the helper refuses without it.
# The values are shell-quoted, since a branch name may hold `;` or `$(...)`.
# Usage: just _push-upstream <branch> ["<next command>"] [gitlab|github]
_push-upstream branch then="" forge="gitlab":
    #!/usr/bin/env bash
    set -euo pipefail
    _branch={{quote(branch)}}
    _then={{quote(then)}}
    _forge={{quote(forge)}}
    PREFIX=""
    if [[ "$_forge" = "gitlab" && -n "${GIT_BOT:-}" ]]; then
        PREFIX="GIT_BOT=$(printf '%q' "$GIT_BOT") "
    fi
    if ! git push -u origin "$_branch"; then
        echo "" >&2
        echo "Error: the push was rejected. Check which identity pushed before assuming" >&2
        echo "  a permission problem:" >&2
        echo "    git config --show-origin --get-all credential.helper" >&2
        if [[ "$_forge" = "gitlab" ]]; then
            echo "  A bot push needs GIT_BOT=<bot> and git-credential-bot as the repo's helper" >&2
            echo "  (just credential-bot-install)." >&2
        else
            echo "    gh auth status" >&2
        fi
        echo "  The remote exists and origin is set. To finish:" >&2
        echo "    ${PREFIX}git push -u origin $(printf '%q' "$_branch")" >&2
        [[ -z "$_then" ]] || echo "    ${PREFIX}$_then" >&2
        exit 1
    fi
    echo ""
    echo "Pushed to origin/$_branch"

# ==========================================
# CLAUDE CODE HOOKS
# ==========================================

# Install Claude Code hooks
#
# Parameters (positional):
#   1. mode - Hook installation level (optional, default: "standard")
#             - "standard"    : Level 1 - session-end + protected-files (no startup cost)
#             - "with-startup": Level 3b - adds session-start (auto-catchup)
#             - "advanced"    : All hooks including auto-format, command-logging
#
# Examples:
#   just hooks-install
#   just hooks-install with-startup
#   just hooks-install advanced
#
# See docs/concept/session-lifecycle.md for cost analysis.
hooks-install mode="standard":
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _mode={{quote(mode)}}

    SETTINGS_FILE=".claude/settings.json"
    HOOKS_DIR=".claude/hooks"
    MODE="$_mode"

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
        HOOKS=("session-start" "session-end" "protected-files" "block-env-dump" "auto-format" "command-logging")
    elif [ "$MODE" = "with-startup" ]; then
        echo "Installing Claude Code hooks (Level 3b - with auto-catchup)..."
        HOOKS=("session-start" "session-end" "protected-files" "block-env-dump")
    else
        echo "Installing Claude Code hooks (Level 1 - no startup cost)..."
        HOOKS=("session-end" "protected-files" "block-env-dump")
    fi

    # Collect the templates for the selected mode
    HOOK_FILES=()
    FOUND_HOOKS=()
    for hook in "${HOOKS[@]}"; do
        HOOK_FILE="$HOOKS_DIR/${hook}.json"
        if [ -f "$HOOK_FILE" ]; then
            HOOK_FILES+=("$HOOK_FILE")
            FOUND_HOOKS+=("$hook")
            echo "  ✓ $hook"
        else
            echo "  ✗ $hook (not found)"
        fi
    done

    # Merge the templates into settings.json. jq's `*` would replace the
    # per-event arrays, so the last template on an event (block-env-dump)
    # dropped every earlier one (protected-files) (#414). This appends per
    # event, then combines entries by matcher and drops duplicates. A hook
    # that runs a juststart script of a template found here
    # (.claude/hooks/[scripts/]<name>.*) but differs from the current
    # version, e.g. the old .claude/hooks/session-end.sh, is replaced. Every
    # other hook stays, and a re-run changes nothing. Keep the program
    # identical at all three sites (justfile x2, templates/base.just).
    HOOK_MERGE_JQ='def odedup: reduce .[] as $x ([]; if any(.[]; . == $x) then . else . + [$x] end);
    def combine: . as $es
      | ([$es[] | (.matcher // "")] | odedup)
      | map(. as $m
          | (if any($es[]; has("matcher") and .matcher == $m) then {matcher: $m} else {} end)
            + {hooks: ([$es[] | select((.matcher // "") == $m) | .hooks[]] | odedup)});
    ($names | split(" ") | map(select(. != ""))) as $ns
    | .[0] as $settings | (.[1:] | map(.hooks // {})) as $adds
    | ([$adds[] | .[] | .[] | .hooks[]]) as $current
    | def stale: (.command | type) == "string"
        and (.command as $c | any($ns[]; . as $n | $c | test("\\.claude/hooks/(scripts/)?" + $n + "\\.")))
        and (. as $h | any($current[]; . == $h) | not);
    $settings
    | .hooks = ((.hooks // {})
          | with_entries(.value |= (map(.hooks |= map(select(stale | not))) | map(select(.hooks | length > 0)))))
    | .hooks = (reduce $adds[] as $add (.hooks;
          reduce ($add | to_entries[]) as $e (.; .[$e.key] = ((.[$e.key] // []) + $e.value)))
        | with_entries(.value |= combine))'
    # Guarded: bash 3.2 (macOS) treats an empty "${HOOK_FILES[@]}" as unset under set -u.
    if [ "${#HOOK_FILES[@]}" -gt 0 ]; then
        jq -s --arg names "${FOUND_HOOKS[*]}" "$HOOK_MERGE_JQ" "$SETTINGS_FILE" "${HOOK_FILES[@]}" > "${SETTINGS_FILE}.tmp"
        mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"
    fi

    # Add gitignore entry for command-logging if installed
    if [[ " ${HOOKS[*]} " =~ " command-logging " ]]; then
        GITIGNORE_ENTRY=".claude/command-log.txt"
        if [ -f ".gitignore" ]; then
            if ! grep -qF "$GITIGNORE_ENTRY" .gitignore; then
                {
                    echo ""
                    echo "# Claude Code command logging"
                    echo "$GITIGNORE_ENTRY"
                } >> .gitignore
                echo "  ✓ Added $GITIGNORE_ENTRY to .gitignore"
            fi
        else
            echo "  ⚠ No .gitignore found - please add $GITIGNORE_ENTRY manually"
        fi
    fi

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
    @if [ -f "$HOME/.claude/settings.json" ]; then \
        echo "=== Global Hooks (~/.claude/settings.json) ==="; \
        jq '.hooks // "No hooks configured"' "$HOME/.claude/settings.json" 2>/dev/null || echo "File exists but no hooks section"; \
    else \
        echo "No global hooks configured (~/.claude/settings.json not found)"; \
    fi

# List available Claude Code hook templates
hooks-list:
    @echo "Available hook templates in .claude/hooks/:"
    @if [ -d ".claude/hooks" ]; then \
        for f in .claude/hooks/*.json; do \
            [ -f "$f" ] || continue; \
            name=$(basename "$f" .json); \
            desc=$(jq -r '._description // "No description"' "$f" 2>/dev/null); \
            printf "  %-20s %s\n" "$name" "$desc"; \
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

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _level={{quote(level)}}

    LEVEL="$_level"
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

# NOTE: 'context' recipe is defined in each language-specific template
# to provide project-type-specific context information.

# ==========================================
# AIDER WORKFLOW WRAPPERS
# ==========================================

# Run the Aider planning workflow
aider-planning request="":
    #!/usr/bin/env bash
    set -euo pipefail
    _request={{quote(request)}}
    if [ ! -x ".aider/scripts/run-workflow.sh" ]; then
        echo "Error: Aider adapter not installed. Run juststart aider-install for this repo."
        exit 1
    fi
    .aider/scripts/run-workflow.sh planning "$_request"

# Run the Aider bot-review workflow
aider-bot-review mr_iid bot="codex" round="1" model="":
    #!/usr/bin/env bash
    set -euo pipefail
    _mr_iid={{quote(mr_iid)}}
    _bot={{quote(bot)}}
    _round={{quote(round)}}
    _model={{quote(model)}}
    if [ ! -x ".ai-harness/scripts/bot-review.sh" ]; then
        echo "Error: shared AI harness bot-review runner not installed. Run juststart ai-harness-install for this repo."
        exit 1
    fi
    .ai-harness/scripts/bot-review.sh "$_bot" "$_mr_iid" "$_round" "$_model"

# Run the Aider catchup workflow
aider-catchup scope="":
    #!/usr/bin/env bash
    set -euo pipefail
    _scope={{quote(scope)}}
    if [ ! -x ".aider/scripts/run-workflow.sh" ]; then
        echo "Error: Aider adapter not installed. Run juststart aider-install for this repo."
        exit 1
    fi
    .aider/scripts/run-workflow.sh catchup "$_scope"

# Run the Aider handoff workflow
aider-handoff summary="":
    #!/usr/bin/env bash
    set -euo pipefail
    _summary={{quote(summary)}}
    if [ ! -x ".aider/scripts/run-workflow.sh" ]; then
        echo "Error: Aider adapter not installed. Run juststart aider-install for this repo."
        exit 1
    fi
    .aider/scripts/run-workflow.sh handoff "$_summary"

# Explain the project workflow with Aider
aider-workflow topic="":
    #!/usr/bin/env bash
    set -euo pipefail
    _topic={{quote(topic)}}
    if [ ! -x ".aider/scripts/run-workflow.sh" ]; then
        echo "Error: Aider adapter not installed. Run juststart aider-install for this repo."
        exit 1
    fi
    .aider/scripts/run-workflow.sh workflow "$_topic"

# ==========================================
# SESSION CONTINUITY
# ==========================================

# Catch up on recent project activity for session continuity
catchup:
    #!/usr/bin/env bash
    set -euo pipefail

    SESSION_NOTES=".ai-harness/session-notes.md"
    LEGACY_SESSION_NOTES=".claude/session-notes.md"
    if [[ ! -f "$SESSION_NOTES" ]] && [[ -f "$LEGACY_SESSION_NOTES" ]]; then
        SESSION_NOTES="$LEGACY_SESSION_NOTES"
    fi

    # The human's async notes come first, outside the session window: the
    # section sits above the first "## Session" block, which the windows below
    # never reach. Template lines (">") are not shown (#462).
    if [[ -f "$SESSION_NOTES" ]]; then
        USER_NOTES=$(awk '/^# .*USER NOTES \(async handoff\)/{f=1; next} /^## Session|^# /{f=0} f && !/^>/' "$SESSION_NOTES")
        if [[ -n "${USER_NOTES//[[:space:]]/}" ]]; then
            echo "=== User Notes (async handoff) ==="
            printf '%s\n' "$USER_NOTES" | sed '/./,$!d'
            echo ""
        fi
    fi

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
    if [[ -f "$SESSION_NOTES" ]]; then
        echo ""
        echo "=== Recent Session Notes ==="
        echo "Source: $SESSION_NOTES"
        # Show last 3 session blocks, newest first like catchup-quick (#381).
        # Writers put the blank line BEFORE each entry, so only the newest
        # block lacks a trailing one; the separator goes after it alone.
        # grep -c already prints 0 on no match and exits 1 while doing so, so
        # '|| echo "0"' fires AFTER a 0 has been printed and the substitution
        # yields two lines. [[ ]] then compares wrong and [ ] errors outright.
        TOTAL=$(grep -c '^## Session' "$SESSION_NOTES" 2>/dev/null || true)
        if [[ "$TOTAL" -gt 0 ]]; then
            START=$((TOTAL > 3 ? TOTAL - 2 : 1))
            awk -v start="$START" '/^## Session/{n++} n>=start{b[n]=b[n] $0 "\n"}
                END{for(i=n;i>=start;i--) printf "%s%s", b[i], (i==n && n>start ? "\n" : "")}' "$SESSION_NOTES"
        else
            tail -50 "$SESSION_NOTES"
        fi
    fi

# Quick catchup - minimal context, no API calls
# Use this at session start to minimize context usage
catchup-quick:
    #!/usr/bin/env bash
    set -euo pipefail

    SESSION_NOTES=".ai-harness/session-notes.md"
    LEGACY_SESSION_NOTES=".claude/session-notes.md"
    if [[ ! -f "$SESSION_NOTES" ]] && [[ -f "$LEGACY_SESSION_NOTES" ]]; then
        SESSION_NOTES="$LEGACY_SESSION_NOTES"
    fi

    # The human's async notes come first, outside the session window: the
    # section sits above the first "## Session" block, which the windows below
    # never reach. Template lines (">") are not shown (#462).
    if [[ -f "$SESSION_NOTES" ]]; then
        USER_NOTES=$(awk '/^# .*USER NOTES \(async handoff\)/{f=1; next} /^## Session|^# /{f=0} f && !/^>/' "$SESSION_NOTES")
        if [[ -n "${USER_NOTES//[[:space:]]/}" ]]; then
            echo "=== User Notes (async handoff) ==="
            printf '%s\n' "$USER_NOTES" | sed '/./,$!d'
            echo ""
        fi
    fi

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
    if [[ -f "$SESSION_NOTES" ]]; then
        echo ""
        echo "=== Recent Session Notes ==="
        echo "Source: $SESSION_NOTES"
        # Show last 2 session blocks, newest FIRST: the 30-line cap then cuts
        # the older block, never the one a catchup is run for (#381)
        # grep -c already prints 0 on no match and exits 1 while doing so, so
        # '|| echo "0"' fires AFTER a 0 has been printed and the substitution
        # yields two lines. [[ ]] then compares wrong and [ ] errors outright.
        TOTAL=$(grep -c '^## Session' "$SESSION_NOTES" 2>/dev/null || true)
        if [[ "$TOTAL" -gt 0 ]]; then
            START=$((TOTAL > 2 ? TOTAL - 1 : 1))
            awk -v start="$START" '/^## Session/{n++} n>=start{b[n]=b[n] $0 "\n"}
                END{for(i=n;i>=start;i--) printf "%s%s", b[i], (i==n && n>start ? "\n" : "")}' "$SESSION_NOTES" | head -30
        else
            tail -30 "$SESSION_NOTES"
        fi
    fi

    echo ""
    echo "For full context (issues, commits): just catchup"

# Add a session note for continuity
# Usage: just session-note "Worked on authentication, decided to use JWT"
session-note summary:
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _summary={{quote(summary)}}

    SESSION_NOTES=".ai-harness/session-notes.md"
    LEGACY_SESSION_NOTES=".claude/session-notes.md"
    MAX_SESSIONS=5
    DATE=$(date +%Y-%m-%d)
    TIME=$(date +%H:%M)

    # Create harness-neutral notes directory if it doesn't exist
    mkdir -p .ai-harness

    # Preserve existing Claude-scoped notes by migrating them on first write.
    if [[ ! -f "$SESSION_NOTES" ]] && [[ -f "$LEGACY_SESSION_NOTES" ]]; then
        cp "$LEGACY_SESSION_NOTES" "$SESSION_NOTES"
        echo "Migrated legacy session notes from $LEGACY_SESSION_NOTES to $SESSION_NOTES"
    fi

    # Create session notes file with header if it doesn't exist
    if [[ ! -f "$SESSION_NOTES" ]]; then
        {
            echo "# Session Notes"
            echo ""
            echo "Use \`just session-note \"summary\"\` to add entries."
            echo ""
            echo "This file is gitignored (local only), harness-neutral, and stored under .ai-harness/."
            echo "Only the last $MAX_SESSIONS sessions are retained."
            echo ""
            # The human's async handoff section (#462). It sits in the header,
            # which retention keeps, and catchup prints it first.
            echo "# 📥 USER NOTES (async handoff)"
            echo ""
            echo "> The human writes here between a handoff and the next catchup; \`just catchup\` shows it first."
            echo "> Newest entry on top: a \`### YYYY-MM-DD HH:MM <topic>\` line, then the text, then a \`---\` line."
            echo "> Never a \`#\` or \`## Session\` heading: those end this section."
            echo "> Local only: this file is gitignored, so a note written on another machine or in the forge does not arrive here."
            echo "> Delete an entry once it has been acted on. Agents do not edit this section."
        } > "$SESSION_NOTES"
    fi

    # Append new session entry
    {
        echo ""
        echo "## Session $DATE $TIME"
        echo ""
        echo "$_summary"
    } >> "$SESSION_NOTES"

    # Retention: keep only last N sessions
    # Same reason as in catchup/catchup-quick: '|| echo "0"' would append a
    # SECOND line and break the comparison below.
    SESSION_COUNT=$(grep -c "^## Session" "$SESSION_NOTES" 2>/dev/null || true)
    if [[ "$SESSION_COUNT" -gt "$MAX_SESSIONS" ]]; then
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

# Show which juststart version scaffolded or last updated this project (#125)
version-show:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -f .juststart-version ]; then
        cat .juststart-version
    else
        echo "No .juststart-version: scaffolded before juststart wrote one." >&2
        echo "'just recipes-update' from a juststart checkout writes it." >&2
        exit 1
    fi

# ==========================================
# GIT ESSENTIALS
# ==========================================

# Show git status
status:
    @git status --short

# Show recent commits
log count="10":
    #!/usr/bin/env bash
    set -euo pipefail
    # Safe interpolation: validate count is numeric before using it as an arg
    _count={{quote(count)}}
    if ! [[ "$_count" =~ ^[0-9]+$ ]]; then
        echo "Error: count must be a positive integer (got: $_count)" >&2
        exit 1
    fi
    git log --oneline -"$_count"

# ==========================================
# FEATURE BRANCH WORKFLOW
# ==========================================

# Create a work branch from main
#
# Parameters (positional, in order):
#   1. issue - Issue number (required)
#   2. name  - Short branch name (required, use hyphens, no spaces)
#   3. type  - Branch type (optional, defaults to "feature")
#
# Example: just branch-create 42 user-authentication
#          just branch-create 43 login-crash fix
#
# Creates branch: <type>/<issue>-<name> (e.g., feature/42-user-authentication)
# Valid types are the ones the workflow documents: feature, fix, hotfix,
# refactor, docs. An unknown type is rejected rather than interpolated.
# Automatically checks out main, pulls, then creates and switches to new branch.
branch-create issue name type="feature":
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _issue={{quote(issue)}}
    _name={{quote(name)}}
    _type={{quote(type)}}

    case "$_type" in
        feature|fix|hotfix|refactor|docs) ;;
        *)
            echo "Error: unknown branch type '$_type'." >&2
            echo "  Valid types: feature, fix, hotfix, refactor, docs" >&2
            exit 1
            ;;
    esac

    BRANCH="${_type}/${_issue}-${_name}"

    # Ensure we're on main and up to date
    git checkout main
    git pull --ff-only

    # Create and switch to the new branch
    git checkout -b "$BRANCH"

    echo "Created and switched to branch: $BRANCH"
    echo ""
    echo "When done, create MR with: just mr-create"

# Delete a branch (local and remote)
#
# Parameters (positional):
#   1. branch - Branch to delete (required). Either the full branch name, or
#               just the <issue>-<name> suffix, which is resolved against the
#               documented branch types.
#
# Example: just branch-delete feature/42-user-authentication
#          just branch-delete 42-user-authentication
#
# Behavior:
#   - Refuses main/master outright, on either side
#   - Switches to main if currently on the target branch
#   - Deletes the local branch once it is merged into origin/<default> or the
#     local default
#   - Deletes the remote branch once it is merged into origin/<default>, which
#     is fetched first; a branch merged only locally is refused until the
#     default is pushed
#   - The merge checks run before anything is deleted, so a "not merged"
#     refusal never leaves one half gone. The lease on the remote delete is
#     checked by origin itself, after the local branch is already gone: if
#     origin moved in that window, the local branch is deleted and the remote
#     one stands, with nothing lost - both were judged merged first
#   - Fails when nothing matched, rather than reporting success for a branch
#     that was never there
branch-delete branch:
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _branch={{quote(branch)}}

    # quote() stops shell injection and does nothing about git's own pattern
    # semantics. Resolution below uses exact refs, so this guard is not what
    # protects it - but the remote existence check further down calls
    # `git ls-remote --heads origin "$BRANCH"`, and ls-remote DOES glob:
    # `ls-remote --heads origin 'fix/4*'` matches and exits 0. So a pattern
    # reaching that far could still select a remote branch nobody named. The
    # realistic trigger is a caller doing `just branch-delete "$BRANCH"` with
    # BRANCH unset.
    case "$_branch" in
        "")
            echo "Error: no branch given." >&2
            exit 1
            ;;
        *[*?[]*)
            echo "Error: '$_branch' contains a pattern character (* ? [)." >&2
            echo "  Name the branch explicitly; patterns would match more than you asked for." >&2
            exit 1
            ;;
    esac

    # Decide what the argument names, then act on that decision. Two rounds of
    # review found regressions from keying this off one signal at a time.
    #
    #   - a name containing a slash carries a type prefix: a full branch name
    #   - a slashless name that is itself an existing ref is also a branch
    #     name; base.just ships to projects predating the convention, where a
    #     branch may simply be called `develop`
    #   - anything else is the bare <issue>-<name> suffix, and only that can
    #     end up unresolved
    #
    # Getting this wrong is not a refusal but a silent partial success: the
    # local delete matches on the literal name while the remote half is
    # skipped, which is worse than the exit-0 bug this recipe started with.
    RESOLVED=1
    BRANCH="$_branch"

    case "$_branch" in
        */*) _is_suffix=0 ;;
        *)   _is_suffix=1 ;;
    esac

    if git show-ref --verify --quiet "refs/heads/$_branch" \
        || git show-ref --verify --quiet "refs/remotes/origin/$_branch"; then
        _is_suffix=0
    fi

    if [ "$_is_suffix" -eq 1 ]; then
        # Exact refs, not patterns. A git ref PATTERN matches "completely or
        # from the beginning up to a slash", so `for-each-ref refs/heads/fix`
        # returns fix/427-... with no trailing slash and no metacharacter
        # involved. One such accidental match would pass the ambiguity guard
        # below and force-delete a branch nobody named. show-ref --verify
        # compares literally, which removes the class instead of filtering the
        # inputs that reach it.
        MATCHES=$(
            for _t in feature fix hotfix refactor docs; do
                if git show-ref --verify --quiet "refs/heads/$_t/$_branch"; then
                    echo "$_t/$_branch"
                fi
            done
        )

        # The local copy may already be gone while the remote branch remains -
        # the ordinary state after deleting a local branch. Reporting that as
        # "does not exist anywhere" would be untrue, so fall back to origin.
        if [ -z "$MATCHES" ]; then
            MATCHES=$(
                for _t in feature fix hotfix refactor docs; do
                    if git show-ref --verify --quiet "refs/remotes/origin/$_t/$_branch"; then
                        echo "$_t/$_branch"
                    fi
                done
            )
        fi

        COUNT=$(printf '%s\n' "$MATCHES" | grep -c . || true)

        if [ "$COUNT" -gt 1 ]; then
            echo "Error: '$_branch' matches more than one branch:" >&2
            printf '%s\n' "$MATCHES" | sed 's/^/  /' >&2
            echo "Pass the full branch name to disambiguate." >&2
            exit 1
        fi

        # Empty when nothing matched. The suffix is then NOT a branch name, so
        # RESOLVED gates the "does not exist" lines below - printing them would
        # present an <issue>-<name> suffix as though it were a branch.
        if [ -z "$MATCHES" ]; then
            RESOLVED=0
        fi
        BRANCH="${MATCHES:-$_branch}"
    fi

    # Never the default branch. branch-cleanup already refuses this; branch-delete
    # did so only by accident, because a slashless name always fell into suffix
    # resolution and matched nothing. Once slashless names became deletable that
    # accident was gone, and the documented post-merge cleanup - `just
    # branch-delete <branch>`, scripted as `$(git branch --show-current)` after a
    # merge has already returned the caller to main - would push a deletion of
    # the default branch to origin. A plain typo does the same.
    case "$BRANCH" in
        main|master)
            echo "Error: refusing to delete '$BRANCH' - it is the default branch." >&2
            exit 1
            ;;
    esac

    # Detect default branch (main or master)
    DEFAULT_BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true)"
    DEFAULT_BRANCH="${DEFAULT_BRANCH#origin/}"
    if [ -z "$DEFAULT_BRANCH" ]; then
        DEFAULT_BRANCH="main"
    fi

    CURRENT=$(git branch --show-current)

    if [ "$CURRENT" = "$BRANCH" ]; then
        echo "Switching to $DEFAULT_BRANCH first..."
        git checkout "$DEFAULT_BRANCH"
    fi

    DELETED=0

    # Whether a branch is merged is a question with an answer, so ask it once,
    # before anything is deleted, rather than letting `git branch -d` infer one.
    # -d accepts a branch merged into its UPSTREAM or into HEAD. After a merge
    # the caller is back on the default branch and a feature branch deleted
    # post-merge often has no upstream left, so -d refused branches that ARE
    # merged - and `|| git branch -D` then force-deleted exactly what -d had
    # refused. That made the check noise in the normal case and no protection
    # in the abnormal one.
    #
    # The check sits above the REMOTE deletion too. Scoping it to "a local ref
    # exists" would let a branch whose local copy is already gone be pushed
    # away unchecked, which is the same hole in the more dangerous direction.
    LOCAL_EXISTS=0
    if git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        LOCAL_EXISTS=1
    fi

    # Only when the name actually resolved. ls-remote matches its argument as a
    # PATTERN, "from the start of the ref or from a slash separator" - so the
    # bare suffix 500-thing matches refs/heads/feature/500-thing and would
    # select a branch nobody named. Verified: `ls-remote --heads origin
    # 427-branch-types` returns refs/heads/fix/427-branch-types and exits 0.
    # The full ref path is passed for the same reason: refs/heads/<suffix>
    # cannot tail-match refs/heads/<type>/<suffix>.
    REMOTE_EXISTS=0
    if [ "$RESOLVED" -eq 1 ] \
        && git ls-remote --exit-code --heads origin "refs/heads/$BRANCH" >/dev/null 2>&1; then
        REMOTE_EXISTS=1
    fi

    # Judge each deletion by ITS OWN subject. A local ref decides the local
    # delete; the LIVE remote tip decides the remote delete. Judging the remote
    # branch by a local or remote-tracking ref would delete newer commits
    # another clone pushed - a stale tip can look merged while the real one is
    # not, and the deletion is not recoverable from this clone.
    REMOTE_TIP=""
    if [ "$REMOTE_EXISTS" -eq 1 ]; then
        REMOTE_TIP=$(git ls-remote --heads origin "refs/heads/$BRANCH" 2>/dev/null | awk 'NR==1 {print $1}')

        # The remote judgement below only trusts origin/<default>, so that ref
        # has to be current: a branch merged server-side (the ordinary merged
        # MR) is unmerged as far as a stale remote-tracking ref can tell, and
        # refusing it is the friction that once led to accepting the local
        # default as evidence. One more network call in a recipe that already
        # makes one; the branch tip itself is deliberately not fetched.
        if ! git fetch --quiet origin "+refs/heads/$DEFAULT_BRANCH:refs/remotes/origin/$DEFAULT_BRANCH"; then
            echo "Error: could not fetch origin/$DEFAULT_BRANCH, so origin/$BRANCH cannot be judged." >&2
            exit 1
        fi
    fi

    # Merged means merged into the default branch - but which default branch
    # depends on what is being deleted, and the two answers differ:
    #
    #   - the LOCAL branch may go once its commits are in origin/<default> OR
    #     in the local default. Either way they live somewhere other than this
    #     branch, and a locally merged, not-yet-pushed branch is deletable.
    #   - the REMOTE branch may go only once its commits are in
    #     origin/<default>. That is the only evidence ORIGIN still has them: a
    #     branch merged into the local default and not pushed leaves the remote
    #     branch as the last ref on origin reaching those commits, and pushing
    #     its deletion strands them there as loose objects until the next gc.
    #
    # One predicate for both deletions made the "or" apply to the remote half
    # as well, which is exactly that hole.
    LOCAL_MERGE_REFS=("refs/remotes/origin/$DEFAULT_BRANCH" "refs/heads/$DEFAULT_BRANCH")
    LOCAL_TARGETS=""
    for _ref in "${LOCAL_MERGE_REFS[@]}"; do
        if git show-ref --verify --quiet "$_ref"; then
            LOCAL_TARGETS="$LOCAL_TARGETS ${_ref#refs/}"
        fi
    done

    # Usage: _branch_delete_is_merged <commit> <ref>...
    _branch_delete_is_merged() {
        _commit="$1"
        shift
        for _t in "$@"; do
            if git show-ref --verify --quiet "$_t" \
                && git merge-base --is-ancestor "$_commit" "$_t"; then
                return 0
            fi
        done
        return 1
    }

    if [ "$LOCAL_EXISTS" -eq 1 ] || [ "$REMOTE_EXISTS" -eq 1 ]; then
        if [ -z "$LOCAL_TARGETS" ]; then
            # Refuse rather than guess: with no default-branch ref there is
            # nothing to judge "merged" against, and deleting anyway is the
            # behaviour this check exists to remove.
            echo "Error: cannot tell whether '$BRANCH' is merged - no $DEFAULT_BRANCH ref found." >&2
            echo "  Fetch origin, or delete it deliberately with: git branch -D $BRANCH" >&2
            exit 1
        fi
    fi

    # Both judgements happen before anything is deleted, so a refusal never
    # leaves the local half gone and the remote half standing.
    if [ "$LOCAL_EXISTS" -eq 1 ] \
        && ! _branch_delete_is_merged "refs/heads/$BRANCH" "${LOCAL_MERGE_REFS[@]}"; then
        echo "Error: '$BRANCH' is not merged into${LOCAL_TARGETS}." >&2
        echo "  Merge it first, or delete it deliberately with: git branch -D $BRANCH" >&2
        exit 1
    fi

    if [ "$REMOTE_EXISTS" -eq 1 ]; then
        if [ -z "$REMOTE_TIP" ] || ! git cat-file -e "${REMOTE_TIP}^{commit}" 2>/dev/null; then
            # origin/<default> was just fetched, so a tip this clone still does
            # not have is not merged there. It cannot be judged; refuse rather
            # than push it away.
            echo "Error: origin/$BRANCH points at a commit this clone does not have." >&2
            echo "  Run: git fetch origin" >&2
            exit 1
        fi
        if ! _branch_delete_is_merged "$REMOTE_TIP" "refs/remotes/origin/$DEFAULT_BRANCH"; then
            echo "Error: origin/$BRANCH is not merged into origin/$DEFAULT_BRANCH." >&2
            echo "  If you merged it locally, push $DEFAULT_BRANCH first." >&2
            echo "  Otherwise merge it, or delete it deliberately with: git push origin --delete $BRANCH" >&2
            exit 1
        fi
    fi

    # Delete local branch
    if [ "$LOCAL_EXISTS" -eq 1 ]; then
        git branch -D "$BRANCH" >/dev/null
        echo "Deleted local branch: $BRANCH"
        DELETED=1
    elif [ "$RESOLVED" -eq 1 ]; then
        echo "Local branch $BRANCH does not exist"
    fi

    # Delete remote branch if it exists (existence was resolved above).
    #
    # Bound to the tip that was actually judged. Between the ls-remote above and
    # this push another clone can advance the branch, and an unconditional
    # delete would remove that newer tip - validating the live tip is not enough
    # on its own, because the value can go stale in the window between the two
    # commands. With the lease the remote refuses instead ("stale info").
    if [ "$REMOTE_EXISTS" -eq 1 ]; then
        if ! git push origin --force-with-lease="refs/heads/$BRANCH:$REMOTE_TIP" --delete "$BRANCH"; then
            echo "Error: origin/$BRANCH moved while this ran - nothing was deleted on origin." >&2
            echo "  Run: git fetch origin, then try again" >&2
            exit 1
        fi
        echo "Deleted remote branch: $BRANCH"
        DELETED=1
    elif [ "$RESOLVED" -eq 1 ]; then
        echo "Remote branch $BRANCH does not exist"
    fi

    if [ "$DELETED" -eq 0 ]; then
        # Two different truths, so two different messages.
        if [ "$RESOLVED" -eq 1 ]; then
            # origin was queried live above, so this is authoritative and
            # fetching cannot change the answer.
            echo "Error: branch '$BRANCH' does not exist locally or on origin." >&2
        else
            # Resolution only read refs/remotes/origin, which is local
            # knowledge, and the one fetch this recipe makes runs only after
            # a name has resolved - so origin was NOT consulted and the
            # message must not imply that it was.
            echo "Error: no branch matching '$_branch' exists locally or in your remote-tracking refs." >&2
            echo "  If it was created elsewhere, run 'git fetch --prune' first." >&2
        fi
        exit 1
    fi

# List work branches of every type the workflow documents
branch-list:
    @git branch --list "feature/*" "fix/*" "hotfix/*" "refactor/*" "docs/*"

# Show current branch
branch-current:
    @git branch --show-current

# ==========================================
# CODE COMPREHENSION
# ==========================================

# Generate a codebase health report for the supervisor
#
# Shows key metrics and trends to help maintain oversight of a growing codebase.
# Output is contextual — not just numbers, but what they mean.
#
# Example: just health-report
health-report:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "=== Codebase Health Report ==="
    echo "Generated: $(date '+%Y-%m-%d %H:%M')"
    echo ""

    echo "--- Size & Composition ---"
    total_files=$(find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -path './venv/*' -not -path './target/*' -not -path './dist/*' -not -path './__pycache__/*' | wc -l | tr -d ' ')
    echo "Total files: $total_files"
    echo ""
    echo "By type:"
    find . -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -path './venv/*' -not -path './target/*' -not -path './dist/*' -not -path './__pycache__/*' | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -15
    echo ""

    echo "--- Recent Activity (last 30 days) ---"
    commits_30d=$(git log --since="30 days ago" --oneline 2>/dev/null | wc -l | tr -d ' ')
    authors_30d=$(git log --since="30 days ago" --format='%aN' 2>/dev/null | sort -u | wc -l | tr -d ' ')
    echo "Commits: $commits_30d"
    echo "Contributors: $authors_30d"
    echo ""
    echo "Most changed files:"
    git log --since="30 days ago" --name-only --pretty=format: 2>/dev/null | grep -v '^$' | sort | uniq -c | sort -rn | head -10
    echo ""

    echo "--- Complexity Indicators ---"
    echo "Largest files (by line count):"
    find . -type f \( -name '*.py' -o -name '*.ts' -o -name '*.js' -o -name '*.go' -o -name '*.rs' -o -name '*.java' -o -name '*.rb' -o -name '*.sh' \) -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -path './venv/*' -not -path './target/*' -exec wc -l {} + 2>/dev/null | sort -rn | head -11
    echo ""

    echo "--- Dependencies ---"
    for depfile in package.json pyproject.toml Cargo.toml go.mod Gemfile build.gradle pom.xml; do
        if [ -f "$depfile" ]; then
            echo "Found: $depfile"
        fi
    done
    echo ""

    echo "--- Test Coverage Indicators ---"
    test_files=$(find . -type f \( -name 'test_*' -o -name '*_test.*' -o -name '*.test.*' -o -name '*.spec.*' \) -not -path './node_modules/*' -not -path './.venv/*' 2>/dev/null | wc -l | tr -d ' ')
    src_files=$(find . -type f \( -name '*.py' -o -name '*.ts' -o -name '*.js' -o -name '*.go' -o -name '*.rs' \) -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -not -path './target/*' -not -name 'test_*' -not -name '*_test.*' -not -name '*.test.*' -not -name '*.spec.*' 2>/dev/null | wc -l | tr -d ' ')
    echo "Test files: $test_files"
    echo "Source files: $src_files"
    if [ "$src_files" -gt 0 ]; then
        ratio=$(echo "scale=1; $test_files * 100 / $src_files" | bc 2>/dev/null || echo "N/A")
        echo "Test-to-source ratio: ${ratio}%"
    fi

# ==========================================
# GIT WORKTREES (Level 3+ Parallel SubAgents)
# ==========================================

# Create a new feature branch and its worktree in one step
#
# Parameters:
#   1. issue - Issue number (required)
#   2. name  - Short branch description (required)
#
# Examples:
#   just worktree-create 42 charts      # branch feature/42-charts + its worktree
#   just worktree-create 42 api-tests
#
# Creates branch feature/<issue>-<name> from local main and its worktree at
# <repo-root>-worktrees/<sanitized-branch>/, without switching the main checkout.
# For a branch that already exists, use `just worktree-add <branch>` instead.
worktree-create issue name:
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _issue={{quote(issue)}}
    _name={{quote(name)}}

    BRANCH="feature/${_issue}-${_name}"

    # Use --git-common-dir to always resolve the main repo root,
    # even when invoked from inside a worktree
    GIT_COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
    REPO_ROOT="$(dirname "$GIT_COMMON")"
    WORKTREE_BASE="${REPO_ROOT}-worktrees"
    SANITIZED="$(echo "$BRANCH" | tr '/' '-')"
    WORKTREE_DIR="${WORKTREE_BASE}/${SANITIZED}"

    # Refuse to clobber an existing worktree
    if [ -d "$WORKTREE_DIR" ]; then
        echo "Error: Worktree directory already exists: $WORKTREE_DIR"
        exit 1
    fi

    # Branch must NOT exist yet (this recipe creates it)
    if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
        echo "Error: Branch '${BRANCH}' already exists."
        echo "Add a worktree for it with: just worktree-add ${BRANCH}"
        exit 1
    fi

    # Base the new branch on local main
    if ! git show-ref --verify --quiet "refs/heads/main"; then
        echo "Error: Local 'main' branch not found; cannot determine base."
        echo "Create the branch manually, then: just worktree-add <branch>"
        exit 1
    fi

    mkdir -p "$WORKTREE_BASE"
    # Create branch + worktree atomically; leaves the main checkout untouched
    git worktree add -b "$BRANCH" "$WORKTREE_DIR" main

    echo ""
    echo "Created branch and worktree:"
    echo "  Directory: $WORKTREE_DIR"
    echo "  Branch:    ${BRANCH} (from main)"
    echo ""
    echo "Next steps:"
    echo "  cd $WORKTREE_DIR"
    echo "  just deps      # Install dependencies"
    echo ""
    echo "When done:"
    echo "  just worktree-remove ${BRANCH}"

# Create a worktree for an existing branch
#
# Parameters:
#   1. branch - Existing branch name (required)
#
# Examples:
#   just worktree-add feature/42-auth
#   just worktree-add fix/38-validation
#
# Creates worktree at <repo-root>-worktrees/<sanitized-branch>/
# Branch must already exist (use `just branch-create` first).
worktree-add branch:
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _branch={{quote(branch)}}

    # Use --git-common-dir to always resolve the main repo root,
    # even when invoked from inside a worktree
    GIT_COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
    REPO_ROOT="$(dirname "$GIT_COMMON")"
    WORKTREE_BASE="${REPO_ROOT}-worktrees"
    SANITIZED="$(echo "$_branch" | tr '/' '-')"
    WORKTREE_DIR="${WORKTREE_BASE}/${SANITIZED}"

    # Check if worktree already exists
    if [ -d "$WORKTREE_DIR" ]; then
        echo "Error: Worktree directory already exists: $WORKTREE_DIR"
        exit 1
    fi

    # Verify the branch exists (local or any remote)
    if git show-ref --verify --quiet "refs/heads/${_branch}"; then
        : # local branch exists
    elif git branch -r --list "*/${_branch}" | grep -q .; then
        : # remote branch exists, git worktree add will track it
    else
        echo "Error: Branch '${_branch}' not found (local or remote)."
        echo "Create it first: just branch-create <issue> <name>"
        exit 1
    fi

    mkdir -p "$WORKTREE_BASE"
    git worktree add "$WORKTREE_DIR" "${_branch}"

    echo ""
    echo "Created worktree:"
    echo "  Directory: $WORKTREE_DIR"
    echo "  Branch:    ${_branch}"
    echo ""
    echo "Next steps:"
    echo "  cd $WORKTREE_DIR"
    echo "  just deps      # Install dependencies"
    echo ""
    echo "When done:"
    echo "  just worktree-remove ${_branch}"

# Remove a worktree and optionally keep the branch
#
# Parameters:
#   1. branch - Branch name used when creating the worktree (required)
#   2. keep   - Pass 'keep' to preserve the branch (optional, default: delete)
#
# Examples:
#   just worktree-remove feature/42-auth         # remove worktree + delete branch
#   just worktree-remove feature/42-auth keep     # remove worktree, keep branch
worktree-remove branch keep="":
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _branch={{quote(branch)}}
    _keep={{quote(keep)}}

    # Use --git-common-dir to always resolve the main repo root,
    # even when invoked from inside a worktree
    GIT_COMMON="$(cd "$(git rev-parse --git-common-dir)" && pwd)"
    REPO_ROOT="$(dirname "$GIT_COMMON")"
    WORKTREE_BASE="${REPO_ROOT}-worktrees"
    SANITIZED="$(echo "$_branch" | tr '/' '-')"
    WORKTREE_DIR="${WORKTREE_BASE}/${SANITIZED}"

    # Check if worktree exists
    if [ ! -d "$WORKTREE_DIR" ]; then
        echo "Worktree not found: $WORKTREE_DIR"
        echo ""
        echo "Available worktrees:"
        git worktree list
        exit 1
    fi

    # Remove worktree
    git worktree remove "$WORKTREE_DIR"
    git worktree prune
    echo "Removed worktree: $WORKTREE_DIR"

    # Delete branch unless 'keep' was passed
    if [ -z "$_keep" ] && [ "$_branch" != "main" ] && [ "$_branch" != "master" ]; then
        if git branch -d "$_branch" 2>/dev/null; then
            echo "Deleted branch: $_branch"
        else
            echo "Branch '$_branch' not fully merged. Use 'git branch -D $_branch' to force delete."
        fi
    elif [ -n "$_keep" ]; then
        echo "Branch '$_branch' kept."
    fi

    # Clean up empty worktree base directory
    if [ -d "$WORKTREE_BASE" ] && [ -z "$(ls -A "$WORKTREE_BASE")" ]; then
        rmdir "$WORKTREE_BASE" 2>/dev/null || true
    fi

# List all worktrees
worktree-list:
    @git worktree list

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

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _mode={{quote(mode)}}

    MODE="$_mode"
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
    @echo "CLAUDE_CODE_ENABLE_TELEMETRY: ${CLAUDE_CODE_ENABLE_TELEMETRY:-not set}"
    @echo "OTEL_METRICS_EXPORTER: ${OTEL_METRICS_EXPORTER:-not set}"
    @echo "OTEL_LOGS_EXPORTER: ${OTEL_LOGS_EXPORTER:-not set}"
    @echo "OTEL_EXPORTER_OTLP_ENDPOINT: ${OTEL_EXPORTER_OTLP_ENDPOINT:-not set}"
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

# Clean up after MR merge: switch to main, pull, delete the LOCAL branch.
# Local only by design: the merge removes the remote branch
# (--remove-source-branch); use branch-delete to delete both sides.
# The branch is resolved and checked before anything is switched or pulled,
# and a branch that does not exist is an error, not a message (#440).
# Usage: just branch-cleanup              # Auto-detect current branch
#        just branch-cleanup feature/42-foo  # Explicit branch name
#        just branch-cleanup 42-foo          # <issue>-<name> suffix, like branch-delete
branch-cleanup branch="":
    #!/usr/bin/env bash
    set -euo pipefail

    # Safe interpolation: quote() prevents shell injection via backticks/$()
    _branch={{quote(branch)}}

    BRANCH="$_branch"
    CURRENT=$(git branch --show-current)

    # Auto-detect branch if not specified
    if [ -z "$BRANCH" ]; then
        if [ "$CURRENT" = "main" ] || [ "$CURRENT" = "master" ]; then
            echo "Error: Already on $CURRENT, nothing to clean up." >&2
            echo "Usage: just branch-cleanup <branch-name>" >&2
            exit 1
        fi
        BRANCH="$CURRENT"
    fi

    # A slashless name that is not itself a local branch is the <issue>-<name>
    # suffix branch-delete accepts. Exact refs only (see branch-delete for why
    # ref patterns are not safe here).
    if [[ "$BRANCH" != */* ]] && ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        MATCHES=$(
            for _t in feature fix hotfix refactor docs; do
                if git show-ref --verify --quiet "refs/heads/$_t/$BRANCH"; then
                    echo "$_t/$BRANCH"
                fi
            done
        )
        COUNT=$(printf '%s\n' "$MATCHES" | grep -c . || true)
        if [ "$COUNT" -gt 1 ]; then
            echo "Error: '$BRANCH' matches more than one branch:" >&2
            printf '%s\n' "$MATCHES" | sed 's/^/  /' >&2
            echo "Pass the full branch name to disambiguate." >&2
            exit 1
        fi
        BRANCH="${MATCHES:-$BRANCH}"
    fi

    # Don't allow cleanup of main/master
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        echo "Error: Cannot clean up main/master branch" >&2
        exit 1
    fi

    if ! git show-ref --verify --quiet "refs/heads/$BRANCH"; then
        echo "Error: local branch $BRANCH does not exist; nothing was changed." >&2
        exit 1
    fi

    echo "Cleaning up branch: $BRANCH"

    # Switch to main if on the branch to be deleted
    if [ "$CURRENT" = "$BRANCH" ]; then
        git checkout main
    fi

    # Pull latest changes
    git pull --ff-only

    if git branch -d "$BRANCH"; then
        echo "Deleted local branch: $BRANCH"
    else
        echo "Warning: Branch not fully merged. Use 'git branch -D $BRANCH' to force delete." >&2
        exit 1
    fi

# ==========================================
# SBOM / SUPPLY CHAIN
# ==========================================

# Generate a CycloneDX SBOM (Software Bill of Materials) for this project.
#
# Uses syft, which auto-detects the ecosystem from manifest/lock files
# (no language toolchain required). The `sbom` CI job pins syft to v1.45.0;
# this recipe uses your locally installed syft (CycloneDX output either way).
# Output: sbom.cdx.json (CycloneDX JSON).
# See docs/concept/pipeline-security.md for why SBOMs matter.
sbom-generate:
    #!/usr/bin/env bash
    set -euo pipefail

    if ! command -v syft >/dev/null 2>&1; then
        echo "Error: syft is not installed."
        echo "Install it with one of:"
        echo "  macOS:  brew install syft"
        echo "  Linux:  curl -sSfL https://raw.githubusercontent.com/anchore/syft/v1.45.0/install.sh | sh -s -- -b /usr/local/bin v1.45.0"
        echo "  Docs:   https://github.com/anchore/syft#installation"
        exit 1
    fi

    echo "Using $(syft --version) (CI pins v1.45.0)"
    syft scan . -o cyclonedx-json=sbom.cdx.json
    echo "SBOM written to sbom.cdx.json (CycloneDX JSON)"
