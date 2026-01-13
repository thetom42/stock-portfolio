---
description: Performance analysis and optimization session
argument-hint: [area to optimize or performance concern]
---
## Optimization Session

Focus: $ARGUMENTS

### Context

- Project structure: !`find . -name "*.py" -o -name "*.ts" -o -name "*.js" -o -name "*.go" -o -name "*.rs" 2>/dev/null | head -20 || echo "Scanning..."`
- Package info: !`cat package.json 2>/dev/null | head -20 || cat Cargo.toml 2>/dev/null | head -20 || cat pyproject.toml 2>/dev/null | head -20 || echo "No package file found"`

### Optimization Framework

1. **Measure First** - What's the current performance baseline?
2. **Identify Bottlenecks** - Where is time/memory being spent?
3. **Hypothesize** - What changes could improve performance?
4. **Implement** - Make targeted changes
5. **Measure Again** - Did it actually improve? By how much?
6. **Document** - Record what worked and why

### Key principles

- **Don't guess** - Profile before optimizing
- **One change at a time** - Isolate improvements
- **Measure impact** - Quantify before/after
- **Consider trade-offs** - Speed vs readability vs maintainability

### Questions to start

1. What performance problem are you experiencing?
2. Do you have metrics or profiling data?
3. What's acceptable performance for this use case?
4. Are there constraints (memory, CPU, latency)?

### Project conventions

@CLAUDE.md

What specific performance concern should we address?
