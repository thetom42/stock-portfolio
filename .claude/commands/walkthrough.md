---
description: Structured code walkthrough for supervisor comprehension
argument-hint: <file, module, or feature to explain>
---
## Code Walkthrough

Target: $ARGUMENTS

### Context

- Project overview: @CLAUDE.md
- Current branch: !`git branch --show-current`

### Walkthrough Structure

I'll create a **narrative walkthrough** of the specified code, designed for the human supervisor who needs to understand the system without reading every line.

#### Approach

1. **Purpose** - What does this code do and why does it exist?
2. **Entry points** - Where does execution begin? What triggers this code?
3. **Control flow** - Walk through the main paths step by step, explaining the *why* not just the *what*
4. **Key data structures** - What are the important types, models, or state?
5. **Dependencies** - What does this code rely on? What relies on it?
6. **Edge cases & error handling** - How does it handle failure?
7. **Design decisions** - Why was it built this way? What alternatives exist?

### Output Format

The walkthrough will be a readable narrative, not a line-by-line annotation. Think of it as explaining the code to a colleague who needs to make decisions about it but won't be editing it directly.

Let me read the relevant code and create the walkthrough.
