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
| Deterministic | ✅ Yes | ❌ No |

**Use User-Invocable Skills for:** Simple prompts, session modes, collaborative thinking (see `../commands/`)

**Use Auto-Activated Skills for:** Complex capabilities requiring scripts, templates, or reference data

## Available Skills

| Skill | Description |
|-------|-------------|
| `skill-creator` | Guide for creating effective skills with templates and scripts |

## Installation

Skills are automatically installed when creating a new project with `just init-project`.

For existing projects:

```bash
# Install skills from juststart
juststart skills-install
```

## Creating New Skills

Use the `/skill-creator` skill for guidance on creating new skills:

```
/skill-creator my-new-skill
```

Or manually:

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
└── skill-creator/
    ├── SKILL.md           # Main skill definition
    ├── scripts/
    │   ├── init_skill.py
    │   ├── package_skill.py
    │   └── quick_validate.py
    ├── references/
    │   ├── workflows.md
    │   └── output-patterns.md
    └── LICENSE.txt
```

## References

- [Claude Code Skills Documentation](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Inside Claude Code Skills](https://mikhail.io/2025/10/claude-code-skills/)
