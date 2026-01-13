---
description: Reproduce issues and create minimal test cases
argument-hint: [issue number or description]
---
## Issue Reproduction

Target: $ARGUMENTS

### Context

- Issue details: !`glab issue view $1 2>/dev/null || gh issue view $1 2>/dev/null || echo "Provide issue details manually"`
- Test files: !`find . -name "*test*" -type f 2>/dev/null | head -10 || echo "No test files found"`

### Goal

Create a **minimal, reproducible test case** that:
1. Clearly demonstrates the issue
2. Can be run automatically
3. Fails now, passes after fix
4. Documents the expected vs actual behavior

### Process

1. **Understand** - What exactly should happen vs what happens?
2. **Isolate** - Strip away everything not related to the bug
3. **Document** - Write a test that captures the failure
4. **Verify** - Confirm the test fails for the right reason

### Output options

- Unit test in existing test suite
- Standalone reproduction script
- Step-by-step reproduction guide
- All of the above

### Project conventions

@CLAUDE.md

What information do you have about this issue?
