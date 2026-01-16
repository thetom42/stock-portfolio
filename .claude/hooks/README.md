# Claude Code Hook Templates

This directory contains hook templates for Claude Code. Hooks provide **deterministic control** over Claude Code's behavior - shell commands that execute automatically at specific lifecycle points.

## Why Hooks?

Unlike LLM-driven decisions, hooks:
- **Always execute** when their trigger condition is met
- Provide **app-level guarantees** rather than prompt-based suggestions
- Enable automation with predictable behavior

## Available Templates

| Template | Event | Purpose |
|----------|-------|---------|
| `session-start.json` | SessionStart | Run `just catchup` automatically (see [Context Warning](#context-warning)) |
| `session-end.json` | SessionEnd | Generate session summary from transcript |
| `protected-files.json` | PreToolUse | Block edits to sensitive files |
| `auto-format.json` | PostToolUse | Run `just fmt` after edits |
| `command-logging.json` | PreToolUse | Log Bash commands for audit |
| `just-recipe-reminder.json` | PreToolUse | Warn when using direct CLI commands instead of Just recipes |
| `observability.json` | PostToolUse, SessionStart, SessionEnd | Log tool executions and session events |

### Scripts

The `scripts/` directory contains shell scripts referenced by hook templates:

| Script | Used By | Purpose |
|--------|---------|---------|
| `session-end.sh` | session-end.json | Parse transcript, generate summary |

## Installation

### Option 1: Automatic (Default)

Claude Code hooks are automatically installed when creating a new project with `just init-project`. The default is **Level 1** (session-end + protected-files) which has zero startup cost. See [Session Lifecycle](../../docs/concept/session-lifecycle.md) for cost analysis.

### Option 2: Using Just Recipe

```bash
just hooks-install              # Level 1: session-end + protected-files (default)
just hooks-install with-startup # Level 3b: + session-start (auto-catchup)
just hooks-install advanced     # All hooks (+ auto-format, command-logging)
just hooks-show                 # Show installed hooks
just hooks-list                 # List available hook templates
```

### Option 3: Manual Installation

1. Copy desired hook configurations to `.claude/settings.json`
2. Merge multiple hooks into the `hooks` object
3. For hooks using scripts:
   - Create `.claude/hooks/` directory
   - Copy scripts from `templates/claude-code/hooks/scripts/`
   - Make scripts executable: `chmod +x .claude/hooks/*.sh`
4. Restart Claude Code

### Option 3: Global Installation

Copy to `~/.claude/settings.json` to apply hooks to all projects.

## Hook Events Reference

| Event | When it Runs | Can Block? |
|-------|--------------|------------|
| SessionStart | New session or resume | No |
| SessionEnd | Session ends | No |
| PreToolUse | Before tool execution | Yes (exit 2) |
| PostToolUse | After tool execution | No |
| Notification | Notification sent | No |
| Stop | Claude finishes responding | No |
| SubagentStop | Subagent completes | No |

### Hook Execution Timeout

Since Claude Code v2.1.3, hook execution timeout has been increased from 60 seconds to **10 minutes**. This allows for longer-running operations like:
- Complex CI checks
- Large file processing
- External API calls with retries

### Hook Input Data

Hooks receive JSON data via stdin. The available fields depend on the event type.

**SessionEnd Input:**
```json
{
  "session_id": "85a2ba61-410a-4325-b79f-7de3718ec0ad",
  "transcript_path": "/Users/.../.claude/projects/.../session-id.jsonl",
  "cwd": "/path/to/project",
  "hook_event_name": "SessionEnd",
  "reason": "prompt_input_exit"
}
```

**Key Discovery: `transcript_path`**

The `transcript_path` field provides access to the complete conversation transcript in JSONL format. Each line is a JSON object with message data:

```jsonl
{"type":"user","message":{"role":"user","content":"..."},...}
{"type":"assistant","message":[{"type":"text","text":"..."}],...}
{"type":"tool_use","tool":"Bash","input":{...},...}
```

This enables advanced use cases:
- **Session summaries**: Parse transcript to extract key actions
- **AI-powered summaries**: Pass transcript to Claude CLI for intelligent summarization
- **Audit logging**: Archive conversations for compliance
- **Metrics**: Track tool usage, message counts, session duration

**Example: Reading transcript in a hook script:**
```bash
input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path // ""')

if [[ -f "$transcript_path" ]]; then
    user_messages=$(grep -c '"type":"user"' "$transcript_path")
    tool_calls=$(grep -c '"tool_use"' "$transcript_path")
    echo "Session had $user_messages user messages and $tool_calls tool calls"
fi
```

## Customization

Each template is a JSON snippet. To customize:

1. Copy the template to your project
2. Modify the `command` field
3. Adjust the `matcher` for specific tools

### Matcher Syntax

- Single tool: `"Bash"`
- Multiple tools: `"Edit|Write"`
- All tools: `"*"`

## Advanced: AI-Powered Session Summaries

The `session-end.sh` script can optionally call Claude CLI headlessly to generate intelligent session summaries. This uses your Claude Max subscription (no API costs).

**Enable AI summaries:**

```bash
# Option 1: Environment variable
export CLAUDE_SESSION_AI_SUMMARY=true

# Option 2: In the hook command
"command": "CLAUDE_SESSION_AI_SUMMARY=true .claude/hooks/session-end.sh"
```

**Requirements:**
- Claude CLI installed and authenticated (`claude --version`)
- Claude Max subscription (or API key configured)

**How it works:**
1. Hook reads the transcript from `transcript_path`
2. Extracts recent conversation context
3. Calls `claude --print` with a summarization prompt
4. Appends the summary to `.claude/session-notes.md`

**Fallback:** If Claude CLI is unavailable or fails, the script generates a basic summary with message counts and recent git commits.

## Defensive Patterns

All hook templates use defensive patterns to handle missing dependencies gracefully:

| Pattern | Purpose | Example |
|---------|---------|---------|
| `cmd 2>/dev/null \|\| true` | Silent fallback, never fails | `just fmt 2>/dev/null \|\| true` |
| `cmd \|\| echo 'warning'` | Warn but continue | `just catchup \|\| echo 'No recipe'` |
| `cmd \|\| (warn; exit 0)` | Warn and allow (fail-open) | protected-files without python3 |

### Dependencies

| Hook | Requires | Fallback Behavior |
|------|----------|-------------------|
| auto-format | `just fmt` recipe | Silently skips if unavailable |
| command-logging | `jq` | Logs timestamp without command details |
| just-recipe-reminder | `jq` | Silently skips if unavailable |
| protected-files | `python3` | Warns and allows edit (fail-open) |
| session-end | `jq`, `git` | Graceful degradation in script |

**Dev Container Support:** All devcontainer templates in `templates/devcontainer/` include `python3` and `jq` as features, ensuring hooks work in containerized environments.

### Project-Specific Recipes

The `auto-format` hook references `just fmt`, which is **project-specific**:

- Python projects: `ruff format .`
- TypeScript: `prettier --write .`
- Rust: `cargo fmt`
- Go: `go fmt ./...`

If your project doesn't have a `just fmt` recipe, the hook silently does nothing (`|| true`). To enable auto-formatting, add a `fmt` recipe to your project's justfile.

## Context Warning

The `session-start.json` hook runs `just catchup` automatically at session start. This command fetches issues, commits, and other project data, which can consume **15-20% of context window**.

**Recommendations:**

| Scenario | Recommendation |
|----------|----------------|
| Long sessions, complex tasks | Skip automatic catchup, use `/catchup` manually when needed |
| Short sessions, quick fixes | Automatic catchup is acceptable |
| Context-sensitive work | Use `just catchup-quick` for minimal context (git status + session notes only) |

**Alternatives to automatic catchup:**
1. **Remove the hook** - Don't install `session-start.json`
2. **Use catchup-quick** - Modify hook to run `just catchup-quick` instead
3. **Manual catchup** - Use `/catchup` skill only when you need full context

The default CLAUDE.md template does NOT enable automatic catchup. It suggests using `/catchup` manually when needed.

## Security Considerations

**Hooks run with your credentials.** Before installing:

1. Review all hook commands
2. Test in a controlled environment
3. Audit hooks regularly
4. Only use hooks from trusted sources

## Example: Complete Configuration

See `examples/settings.json` for a complete configuration combining multiple hooks.

## References

- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Hooks Reference](https://code.claude.com/docs/en/hooks)
