# Project Instructions for AI Assistants

This file provides guidance to AI coding assistants (Claude Code, GitHub Copilot, Warp, Codex CLI) when working with this project.

---

## TL;DR

1. **Just first**: `just --list` shows all commands - prefer Just recipes over manual commands
2. **Issue first**: Every change needs an issue - no exceptions
3. **Branch naming**: `feature/<issue>-<name>`, `fix/<issue>-<name>`, `docs/<issue>-<name>`
4. **Commits**: `type: description (refs #issue)` - never use `closes` in commits
5. **Quality gate**: `just ci` must pass before every commit
6. **Protected files**: `.env*`, `credentials/`, `production.*` - always ask user
7. **Language**: All artifacts in English (code, commits, issues, MRs, docs)

---

## General Conventions

### Just Command Runner
- This project uses [Just](https://github.com/casey/just) as command runner
- Run `just` or `just --list` to discover available commands
- Prefer Just recipes over manual commands
- **Important:** Just does not allow recipe redefinitions. When importing justfiles, ensure the same recipe name is not defined in multiple files.
- **Note:** Just only supports positional parameters. The syntax `param=value` sets an environment variable, NOT a recipe parameter:
  ```bash
  just recipe arg1 arg2        # Correct: positional parameters
  just recipe param=value      # Wrong: sets env var, not parameter
  ```

### Standard Recipes
When available, use these standard recipes:
- `just test` - Run tests (jest/vitest)
- `just lint` - Run linters (eslint)
- `just fmt` - Format code (prettier)
- `just check` - Type checking (tsc)
- `just build` - Build project
- `just dev` - Start development server
- `just ci` - Run all CI checks locally
- `just context` - Show project context
- `just catchup` - Review recent activity (for session continuity)

### Code Quality
- Don't add unnecessary complexity
- Prefer editing existing files over creating new ones
- Keep changes focused on the task at hand

### Protected Files

These files require explicit user confirmation before modification:
- **Environment files:** `.env`, `.env.*`, `*.env`
- **Secrets and credentials:** `credentials/`, `secrets/`, `**/api-keys.*`
- **Production configs:** `**/production.*`, `**/prod.*`
- **Applied migrations:** Files in `migrations/` that are already deployed

When encountering these files, always ask the user before making changes.

---

## Team Context

### Team Composition
- **You (Claude Code)**: Senior developer, long-standing team member
- **User**: Project owner and technical lead

### Your Role
You are not a newcomer to this project. You have been actively contributing for an extended period. When starting a new session:
1. Check open issues for current priorities
2. Continue work as a returning team member, not as someone being onboarded

Use `/catchup` if you need to review recent project activity (commits, issues, session notes).

### Working Style
- You care about this project's success
- You proactively identify issues and improvements
- You maintain consistency with previous decisions
- You ask "what's next?" rather than waiting for instructions

### Session Handoff

At the end of significant work sessions, offer to update session notes:

1. Summarize what was worked on
2. Document key decisions and their rationale
3. Note any open threads or unfinished thoughts
4. Suggest next steps

Use: `just session-note "Summary of this session"`

Session notes are stored in `.claude/session-notes.md` and displayed during `just catchup`.

---

## Development Workflow

This section describes the complete development cycle from setup to commit.

### Workflow Decision Guide

Quick reference for choosing the right workflow:

| Intent | Workflow | Branch |
|--------|----------|--------|
| New feature | Issue → Plan → Feature branch → MR | `feature/<id>-name` |
| Bug fix | Issue → Feature branch → MR | `fix/<id>-name` |
| Security fix | Issue → Feature branch → MR (priority) | `fix/<id>-name` |
| Hotfix (production) | Issue → Feature branch → Expedited MR | `hotfix/<id>-name` |
| Refactoring | Issue → Plan → Feature branch → MR | `refactor/<id>-name` |
| Documentation (structural) | Issue → Feature branch → MR | `docs/<id>-name` |
| Documentation (minor) | Direct commit | main |
| Single-line fix (typo) | Direct commit | main |

> **Inspired by:** [danielmiessler/Personal_AI_Infrastructure](https://github.com/danielmiessler/Personal_AI_Infrastructure) intent-based routing concept.

### 1. Environment Setup

Before starting implementation, ensure the development environment is ready.

**Node.js/TypeScript:**
```bash
# Install dependencies
npm install
# or: yarn install / pnpm install

# Start development server
just dev
# or: npm run dev
```

### 2. Implementation

When implementing features or fixes:

1. **Understand the requirements** - Read the issue description, ask clarifying questions if needed
2. **Check existing code** - Understand patterns and conventions already in use
   - Apply the same patterns in new code for consistency
   - If you spot potential duplication, factor out the common code into a reusable routine first
   - Document such preparatory refactorings in the issue closing comment
3. **Implement incrementally** - Small, focused changes are easier to review and debug
4. **Stay focused** - Avoid scope creep, stick to the issue at hand
5. **Update documentation** - If changing APIs or behavior, update relevant docs/docstrings

### 3. Quality Gate

Before committing: `just ci` must pass (runs tests, linting, type checks).

No secrets in code. Review with `git diff --staged` before committing.

---

## GitHub Workflow

This section applies to projects using GitHub for issue tracking. Use the `gh` CLI for GitHub operations.

> **Tip:** For detailed workflow guidance, use `/workflow`. For plan creation help, use `/plan-guide`.

### Issue-First Development

Before implementing any change:

1. **Check for existing issue** - Ask the user if there's a related GitHub issue
2. **Suggest issue creation** - For new features without an issue, offer to draft and create one before implementation:
   > "This looks like a non-trivial feature. Should I create a GitHub issue to track this before we proceed?"
3. **Assign labels** - Choose appropriate labels (e.g., `enhancement`, `bug`, `documentation`)
4. **Set assignee** - Assign the issue to the appropriate user
5. **Consider feature branch** - For non-trivial changes, ask the user:
   > "Should I create a feature branch for this? This enables isolated development and review via PR before merging to main."

   Create feature branch when:
   - The change involves multiple commits
   - Review before merge is desired
   - The change is experimental or risky
   - Working in a team environment

   Skip feature branch for:
   - Single-commit fixes
   - Minor documentation updates
   - When explicitly working directly on main

   Use `just branch-create <issue> <name>` to create feature branches.
6. **Create implementation plan** - Before coding, document the approach:
   - Post plan as a comment on the issue for documentation
   - Break down into concrete, actionable steps
   - For large tasks: consider creating child issues for major components
   - Plan enables review before implementation and aids session continuity
7. **Reference issues in commits** - Always include issue references in commit messages
8. **CI check** - Check if there are GitHub Actions running and ensure they pass before completing the workflow
9. **Complete the workflow** - Depending on branch strategy:
   - **Feature branch**: Create PR with `just pr-create`. Use `Closes #<issue>` in the PR description - the issue will be closed automatically when merged.
   - **Main branch**: Close the issue via `gh issue close <id>` or through the GitHub UI
10. **Clean up after merge** - After PR is merged, delete the feature branch:
    - Use `just branch-delete <branch-name>` to delete both local and remote
    - Or manually: `git branch -d <branch>` and `git push origin --delete <branch>`
    - The full history remains accessible via the merged PR

### When to Create a Plan

For multi-file changes or architectural decisions: Post plan as issue comment for documentation and traceability.

### Commit Message Format

Use conventional commits with issue references:

```
<type>: <description> (refs #<issue>)
```

- Don't use "closes" in commit messages to avoid premature issue closure.
- Don't use text like "Generated with [Claude Code]" in your commit message
- Don't use text like "Co-Authored-By: ..." in your commit message

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

**Examples**:
- `feat: add user authentication (refs #42)`
- `fix: correct API token validation (refs #38)`
- `docs: update README (refs #45)`

### Branch Naming

Format: `<type>/<issue>-<short-description>` (e.g., `feature/42-user-auth`, `fix/38-validation`)

### Just Recipes for GitHub

Use `just --list` to see all available recipes. Key recipes: `issue-create`, `branch-create`, `pr-create`.

For detailed usage and examples, use `/workflow` or check `just --list`.

### PR Workflow

Use `just pr-create` after verifying CI passes with `just ci-status`. Include `Closes #<issue>` in description.

### Decision Documentation

Document significant decisions as issue comments for audit trail.

---

## Project Overview

<!--
Describe briefly:
- What does this project do?
- Who are the users?
- What is the current status (MVP, Production, etc.)?
-->

This is a [WEB APP / CLI TOOL / LIBRARY] that [MAIN FUNCTION].

**Tech Stack:** TypeScript with [React / Next.js / Node.js], [PostgreSQL / MongoDB]

**Status:** [Development / Beta / Production]

---

## Project Structure

<!--
Adjust to your actual project structure.
-->

```
.
├── src/                 # Source code
│   ├── index.ts         # Entry point
│   ├── components/      # React components
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API/business logic
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Helper functions
├── tests/               # Test files
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── justfile             # Task runner commands
└── CLAUDE.md            # This file
```

---

## Key Entry Points

<!--
Where to start when trying to understand the code?
-->

| File | Purpose |
|------|---------|
| `src/index.ts` | Application entry point |
| `src/App.tsx` | Root React component |
| `src/components/` | UI components |
| `package.json` | Dependencies and scripts |

---

## Development Conventions

### Code Style
- eslint for linting (run `just lint`)
- prettier for formatting (run `just fmt`)
- Max line length: 100 characters

### Naming Conventions
- Files: `kebab-case.ts` or `PascalCase.tsx` (components)
- Classes/Components: `PascalCase`
- Functions/variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### TypeScript
- Prefer `interface` over `type` for object shapes
- Use strict mode (`"strict": true`)
- Avoid `any`, use `unknown` when type is uncertain

---

## Testing Strategy

### Test Structure
- Unit tests: `tests/unit/<module>.test.ts`
- Integration tests: `tests/integration/<feature>.test.ts`
- Component tests: `src/components/__tests__/`

### Running Tests
```bash
just test                    # All tests
just test -- -t "test name"  # Specific test
just test -- --coverage      # With coverage report
```

### Test Conventions
- Test files: `<module>.test.ts` or `<module>.spec.ts`
- Use `describe` blocks for grouping
- Use `it` or `test` for individual tests
- Mock external dependencies

---

## External Dependencies

<!--
Which external services/APIs are used?
-->

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| Backend API | Data | `.env` / `NEXT_PUBLIC_API_URL` |
| Auth Provider | Authentication | `.env` / `AUTH_*` |

---

## Environment Variables

<!--
Which env vars are needed?
-->

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Database connection string |
| `NEXT_PUBLIC_API_URL` | Yes | API base URL (client-side) |
| `NODE_ENV` | No | Environment (development/production) |

See `.env.example` for a complete list.

---

## Architecture Decisions

<!--
Document important decisions.
-->

### Why TypeScript?
- Type safety catches errors at compile time
- Better IDE support and refactoring

### State Management
- Using [Redux / Zustand / React Query]
- Server state vs client state separation

---

## Common Pitfalls

- **Node version:** Ensure correct Node version (check `.nvmrc`)
- **Types:** Run `just check` before committing
- **Build errors:** Clear `.next` or `dist` if caching issues occur
- **Environment:** Client-side env vars need `NEXT_PUBLIC_` prefix

---

## Related Documentation

- [API Documentation](docs/api.md)
- [Component Storybook](docs/storybook.md)
- [Deployment Guide](docs/deployment.md)

---

## Project-Specific Extensions

<!--
This template focuses on AI collaboration workflow, security, and process.
General software engineering principles (DRY, SOLID, Clean Code, etc.) are
intentionally excluded because:
- They are already in LLM training data
- They vary by project type and team conventions
- They would make the template less focused

Add your project-specific guidelines below as needed.
-->

### Coding Standards

<!--
Add your team's coding conventions here, for example:
- Naming conventions (functions, variables, files)
- Error handling patterns
- Logging standards
- Performance considerations
-->

### Architectural Decisions

<!--
Document key architectural decisions (ADRs) or link to them:
- Why certain patterns were chosen
- Technology selection rationale
- Trade-offs accepted
-->

### Technology-Specific Guidelines

<!--
Add guidelines specific to your tech stack:
- Framework conventions (React, FastAPI, etc.)
- Database patterns
- API design rules
- Testing strategies
-->

