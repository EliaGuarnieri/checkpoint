# Domain docs

How the engineering skills should consume this repository's domain documentation.

## Before exploring, read these

- `CONTEXT.md` at the repository root.
- Relevant ADRs under `docs/adr/`.

If one of these files does not exist, proceed without flagging its absence. The `/domain-modeling` skill creates domain documentation when terms or decisions need to be recorded.

## File structure

This is a single-context repository:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── src/
```

## Use the glossary's vocabulary

When output names a domain concept, use the term defined in `CONTEXT.md`. Do not replace it with a synonym that the glossary explicitly rejects.

If the required concept is absent, reconsider whether the project already uses another term. If it is a real gap, record it for `/domain-modeling`.

## Flag ADR conflicts

If proposed work contradicts an existing ADR, state the conflict instead of silently overriding the decision.
