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
| `protected-files.json` | PreToolUse | Block edits to sensitive files. Needs `scripts/protected-files.{sh,py}`: without them every write is **blocked** with a message, not let through; `just hooks-templates-update` brings them |
| `block-env-dump.json` | PreToolUse | Block unfiltered env dumps that could expose secrets |
| `auto-format.json` | PostToolUse | Run `just fmt` after edits |
| `command-logging.json` | PreToolUse | Log Bash commands for audit |
| `just-recipe-reminder.json` | PreToolUse | Block a glab/gh command when a Just recipe covers that exact operation (`glab mr note` → `mr-note`); remind only when just the family has recipes |
| `observability.json` | PostToolUse, SessionStart, SessionEnd | Log tool executions and session events |

### Scripts

The `scripts/` directory contains shell scripts referenced by hook templates:

| Script | Used By | Purpose |
|--------|---------|---------|
| `block-env-dump.sh` | block-env-dump.json | Block unfiltered printenv/env/set/export/declare, also through a path, wrapper, `sh -c`, a shell reading a here-document or here-string, or a substitution. A seatbelt against accidental dumps, not a boundary: the shell's grammar is larger than any check of its text, so the real protection is keeping tokens out of the agent's environment |
| `session-end.sh` | session-end.json | Parse transcript, generate summary |
| `just-recipe-reminder.sh` | just-recipe-reminder.json | Block glab/gh when the exact Just recipe exists, remind for the family |
| `protected-files.sh` + `.py` | protected-files.json | Block Edit/MultiEdit/Write/NotebookEdit on protected files: the target is resolved (symlinks, `..`) and matched case-insensitively, and a write that names no file is blocked |

## Installation

### Option 1: Automatic (Default)

Claude Code hooks are automatically installed when creating a new project with `just init-project`. The default is **Level 1** (session-end + protected-files) which has zero startup cost. See [Session Lifecycle](https://gitlab.thetom42.duckdns.org/snuffel/devtools/juststart/-/blob/main/docs/concept/session-lifecycle.md) for cost analysis.

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
   - Create the `.claude/hooks/scripts/` directory
   - Copy scripts from `templates/claude-code/hooks/scripts/` into it
   - Make them executable: `chmod +x .claude/hooks/scripts/*.sh .claude/hooks/scripts/*.py`
4. Restart Claude Code

### Option 3: Global Installation

Copy to `~/.claude/settings.json` to apply hooks to all projects.

This works only for the hooks whose command is self-contained: auto-format, command-logging,
observability, session-start. The script-based hooks run scripts from the project's
`.claude/hooks/scripts/`, so they belong in the project's `.claude/settings.json`:
block-env-dump, just-recipe-reminder, privacy-protected, privacy-roster-guard, protected-files,
session-end. Installed globally, protected-files blocks every write in a project that lacks
its script.

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

## Important: Combining Hooks with Same Matcher

**Multiple hooks for the same matcher MUST be combined into a single entry.** Claude Code may only execute one of multiple entries with the same matcher.

**Wrong - separate entries:**
```json
{
  "PreToolUse": [
    { "matcher": "Bash", "hooks": [{ "type": "command", "command": "script1.sh" }] },
    { "matcher": "Bash", "hooks": [{ "type": "prompt", "prompt": "..." }] }
  ]
}
```

**Correct - combined entry:**
```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        { "type": "command", "command": "script1.sh" },
        { "type": "prompt", "prompt": "..." }
      ]
    }
  ]
}
```

When merging templates manually, combine all hooks with the same matcher into one array.

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
"command": "CLAUDE_SESSION_AI_SUMMARY=true .claude/hooks/scripts/session-end.sh"
```

**Requirements:**
- Claude CLI installed and authenticated (`claude --version`)
- Claude Max subscription (or API key configured)

**How it works:**
1. Hook reads the transcript from `transcript_path`
2. Extracts recent conversation context
3. Calls `claude --print` with a summarization prompt
4. Appends the summary to `.ai-harness/session-notes.md`

**Fallback:** If Claude CLI is unavailable or fails, the script generates a basic summary with message counts and recent git commits.

## Defensive Patterns

All hook templates use defensive patterns to handle missing dependencies gracefully:

| Pattern | Purpose | Example |
|---------|---------|---------|
| `cmd 2>/dev/null \|\| true` | Silent fallback, never fails | `just fmt 2>/dev/null \|\| true` |
| `cmd \|\| echo 'warning'` | Warn but continue | `just catchup \|\| echo 'No recipe'` |
| `command -v dep \|\| { warn; exit 0; }; cmd` | Warn and allow only when a dependency is missing | protected-files without python3 |

### Dependencies

| Hook | Requires | Fallback Behavior |
|------|----------|-------------------|
| auto-format | `just fmt` recipe | Silently skips if unavailable |
| block-env-dump | `python3`, `bash` | Allows command if python3 unavailable (fail-open) |
| command-logging | `jq` | Logs timestamp without command details |
| just-recipe-reminder | `jq`, `just` | Allows command if jq unavailable (fail-open) |
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

## Why Prompt-Based Hooks Are Problematic

Claude Code supports two hook types: **command-based** (shell commands) and **prompt-based** (LLM evaluation). We strongly recommend **command-based hooks only**.

### Problems with Prompt-Based Hooks

| Issue | Impact |
|-------|--------|
| **Non-deterministic** | Claude interprets the prompt differently each time |
| **Noisy** | Shows "condition not met" messages repeatedly |
| **Session-bound** | Config changes require session restart |
| **Overhead** | LLM evaluation runs for every matching tool call |
| **Unreliable blocking** | May not consistently block when intended |

### Recommended Patterns

| Instead of... | Use... |
|---------------|--------|
| Prompt hook for conditional logic | Command script with explicit checks |
| Prompt hook for reminders | Skill/command that user invokes explicitly |
| Prompt hook for validation | Command hook with deterministic exit codes |

**Example:** The pre-MR code simplification was originally a prompt hook. It was replaced with the explicit `/simple` command because:
- User controls when it runs (deterministic)
- No false positives or missed triggers
- Clear success/failure feedback

### When Prompt Hooks Might Be Acceptable

- Low-stakes suggestions (not blocking)
- Situations where non-determinism is acceptable
- Experimental/prototype workflows

For production workflows, always prefer command-based hooks.

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
