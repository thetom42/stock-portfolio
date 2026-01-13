# Claude Code Custom Slash Command Templates

This directory contains slash command templates for collaboration and session management in Claude Code projects.

## Purpose

Slash commands complement the Just recipes workflow by providing **collaboration modes** and **session management**—the human-AI interaction layer that surrounds the technical workflow.

```
┌─────────────────────────────────────────────────────────────┐
│  Slash Commands: Collaboration & Session Management         │
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

## Available Commands

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
| `/prime` | Load project context and knowledge for new sessions |
| `/handoff` | End-of-session handoff - summarize work and create session notes |

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

## Command vs Just Recipe

| Use Slash Commands for | Use Just Recipes for |
|------------------------|---------------------|
| Session framing | Workflow operations |
| Collaborative thinking | Deterministic tasks |
| Discussion structure | CI/CD integration |
| Planning sessions | Repeatable automation |

## Session Handoff Strategy

The `/handoff` command works complementarily with the [SessionEnd hook](../hooks/README.md):

| Mechanism | Type | Best For |
|-----------|------|----------|
| `/handoff` | Manual, interactive | Significant sessions requiring quality summaries, git operations |
| SessionEnd hook | Automatic, silent | Safety net for all sessions, crash recovery |

**Recommended approach:** Configure the SessionEnd hook as a baseline safety net, and use `/handoff` explicitly for important work sessions where interactive summarization and git operations are valuable.

See the [Session Handoff Strategies](../../docs/ai-assisted-development-concept.md#session-handoff-strategies) section in the concept paper for detailed comparison.

## References

- [Claude Code Slash Commands Documentation](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [AI-Assisted Development Concept Paper](../../docs/ai-assisted-development-concept.md)
