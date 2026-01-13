---
description: Load project context and knowledge for new sessions
---
## Project Priming

Loading project context for effective collaboration.

### Project Overview

- Project root: !`pwd`
- Structure: !`find . -maxdepth 2 -type d -not -path "*/\.*" -not -path "*/node_modules/*" -not -path "*/__pycache__/*" 2>/dev/null | head -20`
- Key files: !`ls -la *.md *.json *.toml *.yaml 2>/dev/null | head -10 || echo "Checking subdirectories..."`

### Documentation

- README: !`head -50 README.md 2>/dev/null || echo "No README.md found"`

### Development Setup

- Package manager: !`cat package.json 2>/dev/null | head -10 || cat Cargo.toml 2>/dev/null | head -10 || cat pyproject.toml 2>/dev/null | head -10 || cat go.mod 2>/dev/null | head -10 || echo "No package file found"`
- Available commands: !`just --list 2>/dev/null | head -15 || echo "No justfile found"`

### Version Control

- Current branch: !`git branch --show-current`
- Recent history: !`git log --oneline -5 2>/dev/null`
- Remote: !`git remote -v 2>/dev/null | head -2`

### Project Conventions

@CLAUDE.md

### Ready to Work

I now have context about:
- Project structure and technology stack
- Available tooling and commands
- Recent activity and current state
- Project conventions and workflow

What would you like to work on?
