# Development Workflow

Purpose: keep issue, branch, commit, verification, and review behavior
consistent across coding harnesses.

Default flow:

1. Start from an issue.
2. Create a branch named for the issue and change type.
3. Implement focused changes that follow existing project patterns.
4. Run the project's deterministic quality gate.
5. Commit with a message that references the issue.
6. Push and create a merge request with the issue closure phrase in the MR
   description.
7. Run the automated review workflow with a reviewer distinct from the
   implementer when possible.
8. Address valid in-scope findings, verify again, and repeat until clean.
9. Hand off to the human reviewer or merge according to project policy.

Adapters may render this flow as a command, skill, agent, or documentation
surface. The workflow semantics stay shared.
