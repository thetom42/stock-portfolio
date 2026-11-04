# Sprint Management

Manage sprints, epics, and issue workflow using GitLab milestones and labels.

> **Note:** These recipes require GitLab. For GitHub projects, use GitHub Projects or Issues directly.

## Sprint Recipes

| Recipe | Purpose |
|--------|---------|
| `just sprint-current` | Show current sprint with issues |
| `just sprint-add <issue>` | Add issue to current sprint |
| `just sprint-create "<title>" [description]` | Create new 1-week sprint |
| `just sprint-close` | Close current sprint |
| `just sprint-velocity [milestone]` | Show velocity (sum of weights) |

## Epic Recipes

| Recipe | Purpose |
|--------|---------|
| `just epics` | List all epic labels |
| `just epic <label>` | List issues for an epic |
| `just epic-create <name> [color]` | Create epic label + tracking issue |
| `just epic-add <issue> <label>` | Add issue to epic |
| `just epic-remove <issue> <label>` | Remove issue from epic |

## Kanban Recipes

| Recipe | Purpose |
|--------|---------|
| `just ready <issue>` | Mark as ready for development |
| `just wip <issue>` | Mark as in progress |
| `just review <issue>` | Mark as in review |
| `just blocked <issue> [reason]` | Mark as blocked |

## Story Points

| Recipe | Purpose |
|--------|---------|
| `just weight <issue> <points>` | Set story points |
| `just weights` | List issues with weights |

## Workflow

### Starting a Sprint

1. **Review backlog:**
   ```bash
   just issue-list
   ```

2. **Create sprint:**
   ```bash
   just sprint-create "Sprint 2025-W03" "Focus: API improvements"
   ```

3. **Add issues to sprint:**
   ```bash
   just sprint-add 42
   just sprint-add 43
   just sprint-add 44
   ```

4. **Set weights (optional):**
   ```bash
   just weight 42 3
   just weight 43 5
   just weight 44 2
   ```

### During Sprint

1. **Check sprint status:**
   ```bash
   just sprint-current
   ```

2. **Track issue progress:**
   ```bash
   just wip 42        # Starting work
   just review 42     # Ready for review
   just blocked 43 "Waiting for API access"
   ```

### Closing Sprint

1. **Review completion:**
   ```bash
   just sprint-current
   just sprint-velocity
   ```

2. **Close sprint:**
   ```bash
   just sprint-close
   ```
   This warns about incomplete issues.

### Epic Management

1. **Create epic:**
   ```bash
   just epic-create "user-authentication"
   ```
   Creates label `epic::user-authentication` and tracking issue.

2. **Add issues to epic:**
   ```bash
   just epic-add 42 user-authentication
   just epic-add 43 user-authentication
   ```

3. **Track epic progress:**
   ```bash
   just epic user-authentication
   ```

## Integration with /workflow

This skill complements `/workflow`:
- `/workflow` - Day-to-day issue and branch management
- `/sprint` - Sprint planning and tracking
- `/planning` - Sprint planning sessions

## Example: Sprint Planning Session

User: "Let's plan the next sprint"

1. `just sprint-current` - Review current sprint status
2. `just sprint-close` - Close if complete
3. `just issue-list` - Review backlog
4. Discuss priorities with user
5. `just sprint-create "Sprint 2025-W04" "Focus: ..."`
6. Add prioritized issues: `just sprint-add <id>`
7. Set weights: `just weight <id> <points>`
8. `just sprint-current` - Confirm sprint setup
