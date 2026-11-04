---
description: Generate architecture diagram for a feature or module
argument-hint: <feature, module, or "overview" for full system>
---
## Architecture Diagram: $ARGUMENTS

### Context

- Project overview: @CLAUDE.md
- Project structure: !`find . -type f -name '*.py' -o -name '*.ts' -o -name '*.js' -o -name '*.go' -o -name '*.rs' -o -name '*.java' 2>/dev/null | grep -v node_modules | grep -v .venv | grep -v __pycache__ | head -30 || echo "No source files found"`

### What I'll Create

A **Mermaid diagram** showing the architecture of **$ARGUMENTS**, saved as a markdown file that renders in GitLab/GitHub.

### Diagram Scope

Based on your input, I'll create the appropriate diagram type:

- **"overview"** - Full system architecture with all major components
- **Feature name** - Components involved in that feature and their interactions
- **Module name** - Internal structure of that module and its external interfaces

### Diagram Content

- Components and their responsibilities (as labeled boxes)
- Data flow between components (as labeled arrows)
- External dependencies and integrations
- Boundaries (e.g., API boundary, database layer)

### Output

The diagram will be saved to `docs/architecture/` as a markdown file containing Mermaid diagram syntax. This renders natively in GitLab and GitHub.

### Process

1. Explore the relevant code to understand the structure
2. Identify components, relationships, and boundaries
3. Generate the Mermaid diagram
4. Save and provide the path

Let me explore the codebase and create the diagram.
