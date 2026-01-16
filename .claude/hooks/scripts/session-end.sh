#!/usr/bin/env bash
# Claude Code SessionEnd Hook
# Generates session summary from conversation transcript
#
# Features:
# - Extracts session metadata from hook input
# - Parses JSONL transcript for key information
# - Optionally calls Claude headlessly for AI summary (requires claude CLI)
# - Appends summary to session-notes.md
#
# Usage: Configured via .claude/settings.json SessionEnd hook
# Input: JSON via stdin with session_id, transcript_path, cwd, reason

set -euo pipefail

# Configuration
SESSION_NOTES_FILE=".claude/session-notes.md"
USE_AI_SUMMARY="${CLAUDE_SESSION_AI_SUMMARY:-false}"  # Set to "true" to enable
MAX_TRANSCRIPT_LINES=100  # Limit for AI context

# Read input from stdin
input=$(cat)

# Parse hook input
transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')
cwd=$(echo "$input" | jq -r '.cwd // "."')
reason=$(echo "$input" | jq -r '.reason // "unknown"')

# Change to project directory
cd "$cwd" || exit 0

# Check if transcript exists
if [[ -z "$transcript_path" ]] || [[ ! -f "$transcript_path" ]]; then
    echo "📝 Session ended. No transcript available for summary."
    exit 0
fi

# Extract session statistics from transcript
extract_stats() {
    local transcript="$1"
    local user_messages tool_calls assistant_messages

    user_messages=$(grep -c '"type":"user"' "$transcript" 2>/dev/null || echo "0")
    assistant_messages=$(grep -c '"type":"assistant"' "$transcript" 2>/dev/null || echo "0")
    tool_calls=$(grep -c '"tool_use"' "$transcript" 2>/dev/null || echo "0")

    echo "Messages: $user_messages user, $assistant_messages assistant | Tool calls: $tool_calls"
}

# Extract git changes made during session
extract_git_changes() {
    # Get commits from today referencing current branch
    local branch commits
    branch=$(git branch --show-current 2>/dev/null || echo "")

    if [[ -n "$branch" ]]; then
        commits=$(git log --oneline --since="1 hour ago" HEAD 2>/dev/null | head -5 || echo "")
        if [[ -n "$commits" ]]; then
            echo "Recent commits:"
            while IFS= read -r line; do echo "  $line"; done <<< "$commits"
        fi
    fi
}

# Generate AI summary using Claude CLI (headless)
generate_ai_summary() {
    local transcript="$1"

    # Check if claude CLI is available
    if ! command -v claude &> /dev/null; then
        return 1
    fi

    # Extract last N lines of conversation for context
    local context
    context=$(tail -n "$MAX_TRANSCRIPT_LINES" "$transcript" | \
        jq -r 'select(.type == "user" or .type == "assistant") |
               if .type == "user" then "User: " + (.message.content // "...")
               else "Assistant: " + ((.message[0].text // .message.content) // "...")[0:200] end' 2>/dev/null | \
        head -50)

    if [[ -z "$context" ]]; then
        return 1
    fi

    # Call Claude headlessly for summary (uses Max subscription, no API costs)
    local summary
    summary=$(echo "$context" | claude --print "Summarize this Claude Code session in 1-2 sentences. Focus on what was accomplished. Be concise." 2>/dev/null || echo "")

    if [[ -n "$summary" ]]; then
        echo "$summary"
        return 0
    fi

    return 1
}

# Generate basic summary without AI
generate_basic_summary() {
    local transcript="$1"
    local stats git_info

    stats=$(extract_stats "$transcript")
    git_info=$(extract_git_changes)

    echo "Session ended ($reason). $stats"
    if [[ -n "$git_info" ]]; then
        echo "$git_info"
    fi
}

# Main: Generate and save summary
main() {
    local summary timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M')

    # Try AI summary if enabled, fallback to basic
    if [[ "$USE_AI_SUMMARY" == "true" ]]; then
        summary=$(generate_ai_summary "$transcript_path") || \
        summary=$(generate_basic_summary "$transcript_path")
    else
        summary=$(generate_basic_summary "$transcript_path")
    fi

    # Append to session notes if file exists
    if [[ -f "$SESSION_NOTES_FILE" ]]; then
        {
            echo ""
            echo "---"
            echo "**$timestamp** (auto-generated)"
            echo "$summary"
        } >> "$SESSION_NOTES_FILE"
        echo "📝 Session summary appended to $SESSION_NOTES_FILE"
    else
        # Just print summary
        echo ""
        echo "📝 Session Summary:"
        echo "$summary"
        echo ""
        echo "Tip: Create $SESSION_NOTES_FILE to auto-save session summaries."
    fi
}

main
