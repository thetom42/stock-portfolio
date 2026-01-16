# Claude Code User-Invocable Skills

This directory contains user-invocable skill templates for collaboration and session management in Claude Code projects.

> **Note:** Since Claude Code v2.1.3, "Slash Commands" and "Skills" are unified. Files in `.claude/commands/` are now called **user-invocable skills** - they are invoked explicitly by the user with `/name`.

## Purpose

User-invocable skills complement the Just recipes workflow by providing **collaboration modes** and **session management**—the human-AI interaction layer that surrounds the technical workflow.

```
┌─────────────────────────────────────────────────────────────┐
│  User-Invocable Skills: Collaboration & Session Management  │
│  - Session types (/concept, /feature, /research)           │
│  - Collaborative thinking (/brainstorm, /discuss, /decide) │
│  - Scrum ceremonies (/planning, /refinement)               │
│  - Debug sessions (/debug, /repro, /optimize)              │
│  - Context management (/catchup, /prime, /handoff)         │
├─────────────────────────────────────────────────────────────┤
│  CLAUDE.md + Just Recipes: Workflow Operations              │
│  - Issue → Branch → Implement → Test → MR                  │
│  - Deterministic, auditable, CI/CD-compatible              │
└─────────────────────────────────────────────────────────────┘
```

## Available Skills

### Session Types

| Command | Description |
|---------|-------------|
| `/concept` | Enter concept and documentation work mode |
| `/feature` | Enter feature implementation mode |
| `/research` | Enter research and evaluation mode |

### Collaboration

| Command | Description |
|---------|-------------|
| `/brainstorm` | Creative ideation session without judgment |
| `/discuss` | Structured discussion on a topic |
| `/decide` | Decision-making with options and trade-offs |

### Scrum Ceremonies (Level 4 Preparation)

| Command | Description |
|---------|-------------|
| `/planning` | Sprint planning session |
| `/refinement` | Backlog refinement session |

### Debug

| Command | Description |
|---------|-------------|
| `/debug` | Structured debugging session with systematic problem analysis |
| `/repro` | Reproduce issues and create minimal test cases |
| `/optimize` | Performance analysis and optimization session |

### Context & Knowledge Management

| Command | Description |
|---------|-------------|
| `/catchup` | Session continuity - review recent activity and restore context |
| `/catchup-quick` | Quick session catchup - minimal context, no API calls |
| `/prime` | Load project context and knowledge for new sessions |
| `/handoff` | End-of-session handoff - summarize work and create session notes |

### Workflow Shortcuts

| Command | Description |
|---------|-------------|
| `/do <task>` | Execute task strictly following the workflow |

### Maintenance (juststart only)

| Command | Description |
|---------|-------------|
| `/claude-md-update <path>` | Update target project's CLAUDE.md with latest templates (intelligent merge) |

## Installation

Copy the command templates to your project's `.claude/commands/` directory:

```bash
# From your project root
mkdir -p .claude/commands
cp path/to/juststart/templates/claude-code/commands/*.md .claude/commands/
```

Or if using `just init-project`:

```bash
just init-project myapp python gitlab
# Commands are automatically copied to .claude/commands/
```

## Usage

In Claude Code, type `/` followed by the command name:

```
/concept architecture decisions
/brainstorm new features for Q2
/planning sprint 23
```

## Customization

These templates are starting points. Customize them for your project by:

1. Adjusting the prompts to match your team's terminology
2. Adding project-specific context with `@file` references
3. Including relevant `!bash` commands for context gathering
4. Modifying the `allowed-tools` frontmatter if needed

## User-Invocable vs Auto-Activated Skills vs Just Recipes

Since Claude Code v2.1.3, both "Slash Commands" and "Skills" are unified under the **Skills** concept:

| Use User-Invocable Skills for | Use Auto-Activated Skills for | Use Just Recipes for |
|------------------------------|------------------------------|---------------------|
| Session framing | Complex capabilities | Workflow operations |
| Collaborative thinking | Scripts + references | Deterministic tasks |
| Discussion structure | Context-based activation | CI/CD integration |
| Simple prompts | Multi-file resources | Repeatable automation |

**User-Invocable Skills** (this directory) are single `.md` files in `.claude/commands/` - simple prompts triggered manually via `/name`. They are **deterministic** because the user controls when they run.

**Auto-Activated Skills** (see `../skills/`) are directories in `.claude/skills/` with `SKILL.md` plus optional scripts and reference files. Claude can auto-activate them when relevant, making them **non-deterministic**.

For more details on auto-activated skills, see the [Skills README](../skills/README.md).

## Session Handoff Strategy

The `/handoff` command works complementarily with the [SessionEnd hook](../hooks/README.md):

| Mechanism | Type | Best For |
|-----------|------|----------|
| `/handoff` | Manual, interactive | Significant sessions requiring quality summaries, git operations |
| SessionEnd hook | Automatic, silent | Safety net for all sessions, crash recovery |

**Recommended approach:** Configure the SessionEnd hook as a baseline safety net, and use `/handoff` explicitly for important work sessions where interactive summarization and git operations are valuable.

See the [Session Handoff Strategies](../../docs/concept/execution-strategy.md#session-handoff-strategies) section in the concept paper for detailed comparison.

## References

- [Claude Code Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [AI-Assisted Development Concept Paper](../../docs/concept/README.md)
