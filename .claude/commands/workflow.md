---
description: Development workflow guidance (issues, branches, MRs/PRs)
argument-hint: [topic: issue|branch|mr|pr|commit|plan]
---
## Development Workflow Guide

Topic: $ARGUMENTS

### Current Context

- Platform: !`git remote -v 2>/dev/null | grep -q gitlab && echo "GitLab" || echo "GitHub"`
- Branch: !`git branch --show-current`
- Status: !`git status --short | head -5`

### Workflow Overview

```
Issue → Branch → Implement → Test → MR/PR → Merge → Cleanup
```

### Issue-First Development

Every change needs an issue first - no exceptions.

1. **Check for existing issue** - Ask user if there's a related issue
2. **Create issue if needed** - Use `just issue-create "Title" "Description" "@me" label`
3. **Assign labels** - `feature`, `bug`, `documentation`, `refactor`
4. **Create feature branch** - `just branch-create <issue> <name>`

### Branch Naming

Format: `<type>/<issue>-<short-description>`

| Type | Use Case | Example |
|------|----------|---------|
| `feature/` | New functionality | `feature/42-user-auth` |
| `fix/` | Bug fixes | `fix/38-validation-error` |
| `docs/` | Documentation | `docs/45-api-docs` |
| `refactor/` | Code restructuring | `refactor/50-cleanup` |
| `hotfix/` | Production fixes | `hotfix/99-critical-bug` |

### Commit Messages

Format: `type: description (refs #issue)`

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

**Rules:**
- Never use `closes` in commits (premature closure)
- Never use "Generated with Claude Code" text
- Never use "Co-Authored-By" text

**Examples:**
```
feat: add user authentication (refs #42)
fix: correct validation logic (refs #38)
docs: update API documentation (refs #45)
```

### Creating a Plan

For multi-file changes or architectural decisions:

1. Post plan as issue comment
2. Display in conversation with checkboxes:
   ```
   [ ] 1. First step
   [x] 2. Completed step
   [ ] 3. Next step
   ```
3. Update checkboxes between implementation steps

**Plan structure:**
- Steps (ordered, concrete actions)
- Files affected
- Open questions

### GitLab Recipes

```bash
# Issues
just issue-create "Title" "Desc" "@me" label1 label2
just issue-list
just issue-view 42
just issue-close 42 "Done"

# Branches
just branch-create 42 "feature-name"
just branch-list
just branch-delete feature-name

# Merge Requests
just mr-create              # Warns if pipeline fails
just mr-create-strict       # Requires passing pipeline

# Pipeline
just ci-status
just push
```

### GitHub Recipes

```bash
# Issues
just issue-create "Title" "Desc" label1 label2
just issue-list
just issue-view 42

# Branches
just branch-create 42 "feature-name"
just branch-list
just branch-delete feature-name

# Pull Requests
just pr-create

# CI
just ci-status
just push
```

### MR/PR Workflow

1. Ensure commits reference issue (`refs #issue`)
2. Verify CI passes: `just ci-status`
3. Create MR/PR: `just mr-create` or `just pr-create`
4. Include `Closes #issue` in description
5. After merge: `just branch-delete <branch>`

### Complex Descriptions

For multi-line descriptions with tables/code, use CLI directly:

```bash
glab issue create --title "Title" --description "$(cat <<'EOF'
## Problem
Multi-line description here
EOF
)" --assignee @me --label feature
```

---

What aspect of the workflow do you need help with?
