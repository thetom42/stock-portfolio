---
description: Create a Product Requirements Document for complex features
argument-hint: [feature name or description]
---
## Product Requirements Document (PRD)

Creating a PRD for: **$ARGUMENTS**

### When to Use a PRD

PRDs are recommended for:
- Features affecting >3 files
- Architectural decisions
- Level 3+ autonomous development
- Features with multiple stakeholders or unclear scope

For simple bug fixes or small changes, a regular issue with plan is sufficient.

### What a PRD Is — and Isn't

A PRD fixes **problem, scope, non-goals, and success criteria** — the contract the implementation is judged against. It is **not** a prose specification to be auto-expanded into code. The most detailed spec is the program itself, so an exhaustive prose hand-off only leaves blanks an agent fills with training-data defaults. Keep the PRD to intent and boundaries; let the implementation be reviewed against them rather than dictated line-by-line up front.

---

### PRD Template

Based on our discussion, I'll create a structured PRD with these sections:

#### 1. Problem Statement
*What problem are we solving? Why does it matter?*

#### 2. Proposed Solution
*High-level approach to solving the problem*

#### 3. Non-Goals
*What is explicitly OUT of scope? This prevents scope creep.*

#### 4. Success Criteria
*How do we measure success? Be specific and measurable.*

#### 5. Acceptance Criteria
*Numbered, testable criteria: `AC-01`, `AC-02`, ... Each states one observable behaviour (input or situation, then expected result) precisely enough to be written as a test without further interpretation. Example:*

```
AC-01: Registration with an existing email -> HTTP 409 with error code EMAIL_TAKEN
AC-02: Password shorter than 8 characters -> rejected before any database access
AC-03: Confirmation email sent within 30s after registration
```

*Success Criteria say whether the feature achieved its goal; Acceptance Criteria say whether the implementation behaves as agreed. They are the contract a review checks and the direct input for test generation, so keep them to behaviour, not implementation steps.*

#### 6. Risks & Mitigations
*What could go wrong? How do we address it?*

#### 7. Open Questions
*What needs to be clarified before or during implementation?*

---

### Instructions

Please provide information for each section based on our discussion. I'll format it into a complete PRD.

If you've already discussed the feature, I can draft the PRD from context - just confirm or adjust each section.

Once the PRD is complete, I'll offer to:
1. **Create a GitLab/GitHub issue** with the PRD as description. Its `## Acceptance Criteria` checklist carries over to the MR, where `/bot-review` verifies it item by item
2. Or **output the PRD** for you to use manually

---

### PRD Output Format

```markdown
# PRD: [Feature Name]

## Problem Statement
[Description]

## Proposed Solution
[Description]

## Non-Goals
- [Item 1]
- [Item 2]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Acceptance Criteria
- [ ] AC-01: [Situation or input] -> [expected, observable result]
- [ ] AC-02: [Situation or input] -> [expected, observable result]

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| [Risk 1] | [Mitigation 1] |

## Open Questions
- [Question 1]
- [Question 2]

---
*PRD created: [Date]*
```

Let me help you create the PRD. What's the **Problem Statement** for this feature?
