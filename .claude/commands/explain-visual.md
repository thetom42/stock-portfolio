---
description: Create interactive HTML visualization to explain code behavior
argument-hint: <algorithm, component, or process to visualize>
---
## Interactive Explanation: $ARGUMENTS

### Context

- Project overview: @CLAUDE.md

### What I'll Create

An **interactive HTML file** that visualizes how **$ARGUMENTS** works, step by step. This is more effective than static documentation for understanding dynamic behavior.

Inspired by Simon Willison's "interactive explanations" pattern.

### Visualization Features

- **Step-by-step animation** showing the algorithm or process in action
- **Play/pause controls** and speed adjustment
- **Frame stepping** for detailed inspection
- **State display** showing relevant variables and data at each step
- **Annotations** explaining what's happening and why

### Process

1. Read and understand the target code
2. Identify the key states and transitions to visualize
3. Create a self-contained HTML file with embedded CSS and JavaScript
4. Save to `docs/visualizations/` (directory created if needed)
5. Provide the file path so you can open it in a browser

### Scope

Best suited for:
- Algorithms with clear steps (sorting, searching, graph traversal)
- State machines and workflow engines
- Data transformation pipelines
- Request/response flows
- Concurrent or async processes

Let me read the relevant code and design the visualization.
