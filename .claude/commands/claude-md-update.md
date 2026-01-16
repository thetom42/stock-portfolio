Update a target project's CLAUDE.md with the latest template changes while preserving project-specific customizations.

**Target project:** $ARGUMENTS

## Prerequisites

This command must be run from within the juststart repository. The target project path is provided as argument.

## Steps

### 1. Validate Target

Verify that `$ARGUMENTS` points to a valid project with a CLAUDE.md:
- Check the path exists
- Check CLAUDE.md exists in that path
- Check justfile exists (to determine project type)

### 2. Create Backup

```bash
cp "$ARGUMENTS/CLAUDE.md" "$ARGUMENTS/CLAUDE.md.backup"
```

### 3. Detect Project Configuration

Read the target project's justfile to determine:
- **Project type**: Look for imports like `python.just`, `typescript.just`, `go.just`, etc.
- **CI type**: Look for imports of `gitlab.just` or `github.just`

### 4. Generate New Template

Use juststart's assembly mechanism to generate a fresh CLAUDE.md:

```bash
just _assemble-claude-md <type> <ci> > /tmp/claude-md-new.md
```

Where `<type>` and `<ci>` are determined from step 3.

### 5. Analyze and Merge

Read both files:
- `$ARGUMENTS/CLAUDE.md.backup` (original with project customizations)
- `/tmp/claude-md-new.md` (fresh template)

**Template sections** (update from new template):
- TL;DR
- General Conventions
- Team Context (except project-specific team info if added)
- Development Workflow
- GitLab Workflow / GitHub Workflow

**Project-specific sections** (preserve from original):
- Project Overview
- Project Structure
- Key Entry Points
- Development Conventions (project-specific parts)
- Testing Strategy
- External Dependencies
- Environment Variables
- Architecture Decisions
- Common Pitfalls
- Related Documentation
- Any custom sections added by the project

**Merge strategy:**
1. Start with the new template structure
2. For each project-specific section, replace the placeholder content with the original project's content
3. If the original had custom sections not in the template, append them at the end

### 6. Write Result

Write the merged content to `$ARGUMENTS/CLAUDE.md`

### 7. Cleanup

```bash
rm /tmp/claude-md-new.md
```

Keep `$ARGUMENTS/CLAUDE.md.backup` for user review.

### 8. Report

Summarize what was done:
- Which template sections were updated
- Which project sections were preserved
- Location of backup file
- Any issues or notes
