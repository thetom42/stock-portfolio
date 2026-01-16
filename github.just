# GitHub Workflow Recipes
# Extended recipes for GitHub operations using gh CLI
# Import this in your project: import 'github.just'
#
# Requires: gh CLI (https://cli.github.com/)
# Auth: gh auth login

# ==========================================
# PROJECT SETUP
# ==========================================

# Create a remote GitHub repository (without connecting or pushing)
# Usage: just remote-init myproject
#        just remote-init myproject myorg public
remote-init name org="" visibility="private":
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Creating GitHub repository {{name}}..."

    VISIBILITY="{{visibility}}"
    REPO_NAME="{{name}}"
    if [ -n "{{org}}" ]; then
        REPO_NAME="{{org}}/{{name}}"
    fi

    # Create repository without linking or pushing
    gh repo create "$REPO_NAME" "--${VISIBILITY}" --description "Created with juststart"

    echo ""
    echo "GitHub repository created!"
    echo "  Repo: $REPO_NAME"
    echo ""
    echo "Next: Run 'just remote-connect' to link and push your local repo"

# Connect local repository to a GitHub remote and push
# Usage: just remote-connect myorg/myproject
#        just remote-connect myproject              # Uses current directory name
remote-connect repo="":
    #!/usr/bin/env bash
    set -euo pipefail

    # Determine repo path
    REPO_PATH="{{repo}}"
    if [ -z "$REPO_PATH" ]; then
        # Try to get from current user + directory name
        REPO_NAME=$(basename "$(pwd)")
        GH_USER=$(gh api user 2>/dev/null | jq -r '.login' 2>/dev/null || echo "")
        if [ -z "$GH_USER" ]; then
            echo "Error: Could not determine GitHub username"
            echo "Usage: just remote-connect myorg/myproject"
            exit 1
        fi
        REPO_PATH="${GH_USER}/${REPO_NAME}"
    fi

    REMOTE_URL="https://github.com/${REPO_PATH}.git"

    echo "Connecting to GitHub remote..."
    echo "  Remote: $REMOTE_URL"

    # Check if origin already exists
    if git remote get-url origin &> /dev/null; then
        EXISTING=$(git remote get-url origin)
        if [ "$EXISTING" = "$REMOTE_URL" ]; then
            echo "  Origin already set correctly"
        else
            echo "  Updating origin from: $EXISTING"
            git remote set-url origin "$REMOTE_URL"
        fi
    else
        git remote add origin "$REMOTE_URL"
    fi

    # Push to remote
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    echo ""
    echo "Pushing to origin/$BRANCH..."
    git push -u origin "$BRANCH"

    echo ""
    echo "Connected and pushed!"
    git remote -v

# Fork a repository
fork repo:
    @gh repo fork {{repo}} --clone

# ==========================================
# ISSUES
# ==========================================

# Create an issue
# Usage: just issue-create "Title" "Description" "assignee" [labels...]
#        just issue-create "Title" "" "@me" feature bug
# Note: Uses $description to handle special characters (backticks, quotes) safely
issue-create title $description="" assignee="" *labels:
    #!/usr/bin/env bash
    set -euo pipefail

    LABEL_ARGS=""
    for label in {{labels}}; do
        LABEL_ARGS="$LABEL_ARGS --label $label"
    done

    ASSIGNEE_ARG=""
    if [ -n "{{assignee}}" ]; then
        ASSIGNEE_ARG="--assignee {{assignee}}"
    fi

    # shellcheck disable=SC2086  # Intentional word splitting for multiple --label/--assignee args
    # shellcheck disable=SC2154  # $description is exported by Just via $ prefix
    gh issue create --title "{{title}}" --body "$description" $ASSIGNEE_ARG $LABEL_ARGS

# List open issues
issue-list:
    @gh issue list

# View an issue
issue-view id:
    @gh issue view {{id}}

# Close an issue with comment
# Note: Uses $message to handle special characters safely
issue-close id $message="Completed":
    @gh issue close {{id}} --comment "$message"

# Add a comment to an issue
issue-note id message:
    @gh issue comment {{id}} --body "{{message}}"

# Reopen an issue
issue-reopen id:
    @gh issue reopen {{id}}

# ==========================================
# ACTIONS / CI
# ==========================================

# Show workflow run status
ci-status:
    @gh run list --limit 5

# View workflow run details
ci-view run_id:
    @gh run view {{run_id}}

# Watch workflow run in progress
ci-watch run_id="":
    #!/usr/bin/env bash
    RUN_ID="{{run_id}}"
    if [ -n "$RUN_ID" ]; then
        gh run watch "$RUN_ID"
    else
        # Watch most recent run
        gh run watch
    fi

# List jobs in a workflow run
ci-jobs run_id:
    @gh run view {{run_id}} --json jobs --jq '.jobs[] | "\(.databaseId): \(.name) (\(.conclusion // .status))"'

# View logs for a workflow run
ci-logs run_id:
    @gh run view {{run_id}} --log

# Download artifacts from a run
ci-artifacts run_id path="./artifacts":
    @mkdir -p {{path}}
    gh run download {{run_id}} --dir {{path}}
    @echo "Artifacts downloaded to {{path}}"
    @ls -la {{path}}

# Rerun a failed workflow
ci-rerun run_id:
    @gh run rerun {{run_id}}

# Rerun only failed jobs
ci-rerun-failed run_id:
    @gh run rerun {{run_id}} --failed

# Cancel a running workflow
ci-cancel run_id:
    @gh run cancel {{run_id}}

# List available workflows
workflows:
    @gh workflow list

# Manually trigger a workflow
workflow-run workflow branch="main":
    @gh workflow run {{workflow}} --ref {{branch}}

# ==========================================
# PULL REQUESTS
# ==========================================

# Create pull request from current branch
# Auto-assigns to current user and adds "Closes #XX" based on branch name
pr-create title="":
    #!/usr/bin/env bash
    set -euo pipefail

    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
        echo "Error: Cannot create PR from main/master branch"
        exit 1
    fi

    # Push branch if needed
    git push -u origin "$BRANCH" 2>/dev/null || true

    TITLE="{{title}}"
    if [ -z "$TITLE" ]; then
        TITLE=$(git log -1 --format=%s)
    fi

    # Extract issue number from branch name (e.g., feature/123-foo -> 123)
    ISSUE_NUM=""
    if [[ "$BRANCH" =~ ^[a-z]+/([0-9]+)- ]]; then
        ISSUE_NUM="${BASH_REMATCH[1]}"
    fi

    # Build body with auto-close reference
    BODY=""
    if [ -n "$ISSUE_NUM" ]; then
        BODY="Closes #${ISSUE_NUM}"
    fi

    # Create PR with assignee and optional body
    if [ -n "$BODY" ]; then
        gh pr create --title "$TITLE" --body "$BODY" --assignee @me
    else
        gh pr create --title "$TITLE" --fill --assignee @me
    fi

# List open pull requests
pr-list:
    @gh pr list

# View a specific pull request
pr-view id="":
    #!/usr/bin/env bash
    PR_ID="{{id}}"
    if [ -n "$PR_ID" ]; then
        gh pr view "$PR_ID"
    else
        gh pr view
    fi

# Check out a pull request
pr-checkout id:
    @gh pr checkout {{id}}

# Merge a pull request
pr-merge id="":
    #!/usr/bin/env bash
    PR_ID="{{id}}"
    if [ -n "$PR_ID" ]; then
        gh pr merge "$PR_ID"
    else
        gh pr merge
    fi

# Review a pull request
pr-review id action="":
    #!/usr/bin/env bash
    PR_ID="{{id}}"
    ACTION="{{action}}"
    if [ -n "$ACTION" ]; then
        gh pr review "$PR_ID" "--${ACTION}"
    else
        gh pr review "$PR_ID"
    fi

# Show PR checks status
pr-checks id="":
    #!/usr/bin/env bash
    PR_ID="{{id}}"
    if [ -n "$PR_ID" ]; then
        gh pr checks "$PR_ID"
    else
        gh pr checks
    fi

# ==========================================
# LABELS
# ==========================================

# List available labels
labels:
    @gh label list

# Create a new label
# Note: Uses $description to handle special characters safely
label-create name color $description="":
    @gh label create "{{name}}" --color "{{color}}" --description "$description"

# Create standard label set for issue tracking
# Creates a consistent set of labels for features, bugs, priorities, etc.
labels-create:
    #!/usr/bin/env bash
    set -euo pipefail

    echo "Creating standard label set..."

    # Define standard labels: name|color|description
    LABELS=(
        "feature|0E8A16|New feature or enhancement"
        "bug|E11D21|Something isn't working"
        "documentation|0052CC|Documentation improvements"
        "refactor|7057FF|Code refactoring"
        "test|1D76DB|Testing related"
        "chore|FBCA04|Maintenance tasks"
        "security|B60205|Security related"
        "performance|D4C5F9|Performance improvements"
        "priority:high|FF0000|High priority"
        "priority:medium|FF7F00|Medium priority"
        "priority:low|2E8B57|Low priority"
        "blocked|000000|Blocked by external dependency"
        "wontfix|CCCCCC|Will not be fixed"
        "duplicate|EEEEEE|Duplicate issue"
        "help-wanted|128A0C|Extra attention needed"
        "good-first-issue|7FDBFF|Good for newcomers"
    )

    for label_def in "${LABELS[@]}"; do
        IFS='|' read -r name color description <<< "$label_def"
        if gh label create "$name" --color "$color" --description "$description" 2>/dev/null; then
            echo "  ✓ Created: $name"
        elif gh label edit "$name" --color "$color" --description "$description" 2>/dev/null; then
            echo "  ✓ Updated: $name"
        else
            echo "  ✗ Failed: $name"
        fi
    done

    echo ""
    echo "Label set created!"

# ==========================================
# RELEASES
# ==========================================

# Create a release
release-create tag:
    @gh release create {{tag}} --generate-notes

# Create release with title and notes
release-create-full tag title notes="":
    @gh release create {{tag}} --title "{{title}}" --notes "{{notes}}"

# List releases
release-list:
    @gh release list

# View a release
release-view tag:
    @gh release view {{tag}}

# Download release assets
release-download tag path="./release":
    @mkdir -p {{path}}
    gh release download {{tag}} --dir {{path}}

# ==========================================
# UTILITY
# ==========================================

# Open repository in browser
browse:
    @gh repo view --web

# Show repository info
info:
    @gh repo view

# Clone a repository
clone repo:
    @gh repo clone {{repo}}

# Set repository as current remote
set-remote repo:
    @gh repo set-default {{repo}}

# Show current user
whoami:
    @gh auth status

# Push and wait for CI
push:
    #!/usr/bin/env bash
    git push
    echo ""
    echo "Waiting for workflow to start..."
    sleep 5
    gh run list --limit 1
