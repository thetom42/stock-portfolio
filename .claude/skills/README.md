# Claude Code Auto-Activated Skills

This directory contains auto-activated skill templates for Claude Code. These are more complex than user-invocable skills - they can include reference files, scripts, and additional resources.

> **Note:** Since Claude Code v2.1.3, "Slash Commands" and "Skills" are unified under a single concept. This directory contains **auto-activated skills** that Claude can trigger based on context.

## User-Invocable vs Auto-Activated Skills

| Aspect | User-Invocable Skills | Auto-Activated Skills |
|--------|----------------------|----------------------|
| Location | `.claude/commands/name.md` | `.claude/skills/name/SKILL.md` |
| Structure | Single file | Directory with files |
| Reference files | No | Yes (scripts/, references/) |
| Invocation | `/name` (user types it) | `/name` or auto-activated |
| Activation | Manual only | Claude can auto-activate |
| Deterministic | Yes | No |

**Use User-Invocable Skills for:** Simple prompts, session modes, collaborative thinking (see `../commands/`)

**Use Auto-Activated Skills for:** Complex capabilities requiring scripts, templates, or reference data

## Available Skills

No bundled skills. For skill creation guidance, install the `skill-creator` plugin from Anthropic.

## Installation

Skills are automatically installed when creating a new project with `just init-project`.

## Creating New Skills

Install the `skill-creator` plugin for guided skill creation, or manually:

1. Create directory: `.claude/skills/my-skill/`
2. Create `SKILL.md` with frontmatter:
   ```markdown
   ---
   name: my-skill
   description: What this skill does and when Claude should use it
   ---
   # My Skill

   Instructions for Claude...
   ```
3. Add optional resources:
   - `scripts/` - Python or shell scripts
   - `references/` - Reference documentation
   - `templates/` - Template files

## Skill Structure Example

```
.claude/skills/
└── my-skill/
    ├── SKILL.md           # Main skill definition
    ├── scripts/
    │   └── helper.py
    ├── references/
    │   └── docs.md
    └── templates/
        └── example.md
```

## References

- [Claude Code Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/)
