# Release Workflow

Guide the release process from version bump to published release.

## Recipes

| Recipe | Purpose |
|--------|---------|
| `just release-status` | Show pending changes and current version |
| `just release-prepare <version>` | Update CHANGELOG, prepare for release |
| `just release-finalize <version>` | Commit, tag, push, create release |
| `just release-abort` | Abort a prepared release |
| `just release-init` | Create initial CHANGELOG.md |

## Workflow

### 1. Check Release Status

```bash
just release-status
```

This shows:
- Current version (from git tags)
- Unreleased changes in CHANGELOG.md
- Pending commits since last release

### 2. Determine Version

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backwards compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

Ask the user if version is unclear based on changes.

### 3. Prepare Release

```bash
just release-prepare 1.2.0
```

This:
- Updates CHANGELOG.md (moves Unreleased to version section)
- Shows diff for review
- Does NOT commit yet

### 4. Review Changes

Review the CHANGELOG.md changes:
- Are all significant changes documented?
- Is the version number correct?
- Are breaking changes clearly marked?

### 5. Finalize Release

```bash
just release-finalize 1.2.0
```

This:
- Commits CHANGELOG.md
- Creates git tag
- Pushes to remote
- Creates GitLab/GitHub release

### 6. Abort if Needed

If something is wrong after prepare:
```bash
just release-abort
```

## CHANGELOG Format

```markdown
# Changelog

## [Unreleased]

### Added
- New feature X

### Changed
- Modified behavior Y

### Fixed
- Bug fix Z

### Removed
- Deprecated feature W

## [1.1.0] - 2025-01-15

### Added
- Previous release notes...
```

## Example Release Session

User: "Let's release the current changes"

1. Run `just release-status` to see what's pending
2. Discuss version number based on changes
3. Run `just release-prepare 1.2.0`
4. Review CHANGELOG diff together
5. Run `just release-finalize 1.2.0`
6. Confirm release was created successfully

## Pre-Release Checklist

Before releasing, ensure:
- [ ] All tests pass: `just ci`
- [ ] CHANGELOG.md has all significant changes
- [ ] No uncommitted changes: `git status`
- [ ] On correct branch (usually main)
- [ ] CI pipeline is green
