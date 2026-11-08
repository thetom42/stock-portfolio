---
description: Generate domain concept map showing entities and relationships
argument-hint: <domain area or "full" for complete domain model>
---
## Concept Map: $ARGUMENTS

### Context

- Project overview: @CLAUDE.md
- Domain models: !`find . -type f \( -name 'models.py' -o -name 'model.py' -o -name 'schema.py' -o -name 'types.ts' -o -name 'entities.go' -o -name '*.entity.*' -o -name '*.model.*' \) 2>/dev/null | grep -v node_modules | grep -v .venv | head -15 || echo "No model files found"`

### What I'll Create

A **visual concept map** of the domain model for **$ARGUMENTS**, showing entities, their attributes, and relationships.

### Map Content

- **Entities** - Domain objects with their key attributes
- **Relationships** - How entities relate (has-many, belongs-to, depends-on)
- **Bounded contexts** - Logical groupings of related entities
- **Key constraints** - Important business rules or invariants

### Output Format

Mermaid entity-relationship diagram saved to `docs/domain/` as a markdown file.

### Process

1. Scan model/entity/schema files for domain objects
2. Identify relationships from foreign keys, references, and associations
3. Map bounded contexts from module/package structure
4. Generate the concept map
5. Save and provide the path

Let me explore the domain model.
