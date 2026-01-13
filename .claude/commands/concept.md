---
description: Enter concept and documentation work mode
argument-hint: [topic or empty for general]
---
## Concept Mode

We're focusing on **conceptual work** today, not implementation.

Topic: $ARGUMENTS

### Context

- Project documentation: !`find docs/ -name "*.md" 2>/dev/null | head -10 || echo "No docs/ directory"`
- Recent documentation changes: !`git log --oneline --all -- "*.md" 2>/dev/null | head -5 || echo "No recent doc changes"`

### In this mode, I will:

- Prioritize discussion and understanding over code
- Ask clarifying questions before documenting
- Suggest documentation structure and content
- Help refine ideas before committing them to docs
- Reference existing documentation with `@file` when relevant

### I will NOT:

- Jump into implementation
- Create feature branches or MRs for code
- Write production code

### Project conventions

@CLAUDE.md

What aspect would you like to explore first?
